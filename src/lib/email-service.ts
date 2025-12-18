import emailjs from '@emailjs/browser';
import { supabase } from './supabase';

// EmailJS Configuration
// Get these values from your EmailJS dashboard: https://dashboard.emailjs.com
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Initialize EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

interface NoticeEmailData {
  title: string;
  content: string;
  date: string;
  priority: string;
  category: string;
  author: string;
}

/**
 * Send notice email to a single resident using EmailJS
 */
export const sendNoticeEmail = async (
  recipientEmail: string,
  recipientName: string,
  notice: NoticeEmailData
): Promise<boolean> => {
  try {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.error('EmailJS configuration is missing. Please set environment variables.');
      return false;
    }

    // Format the notice date
    const noticeDate = new Date(notice.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Category labels
    const categoryLabels: Record<string, string> = {
      general: 'General Notice',
      maintenance: 'Maintenance',
      event: 'Event',
      emergency: 'Emergency'
    };

    // Priority labels
    const priorityLabels: Record<string, string> = {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority'
    };

    // Prepare email template parameters
    const templateParams = {
      to_email: recipientEmail,
      to_name: recipientName,
      notice_title: notice.title,
      notice_content: notice.content,
      notice_date: noticeDate,
      notice_priority: priorityLabels[notice.priority] || notice.priority,
      notice_category: categoryLabels[notice.category] || notice.category,
      notice_author: notice.author,
      society_name: 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.',
      society_address: 'MANPADA, THANE (WEST)-400 610',
      society_phone: '022 35187410',
    };

    // Send email via EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error sending email via EmailJS:', error);
    return false;
  }
};

/**
 * Send notice email to all residents with email addresses
 */
export const sendNoticeToAllResidents = async (
  notice: NoticeEmailData
): Promise<{ success: number; failed: number }> => {
  try {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.error('EmailJS configuration is missing');
      return { success: 0, failed: 0 };
    }

    // Fetch all residents with email addresses
    const { data: residents, error } = await supabase
      .from('residents')
      .select('email, owner_name, flat_number')
      .not('email', 'is', null);

    if (error) {
      console.error('Error fetching residents:', error);
      return { success: 0, failed: 0 };
    }

    if (!residents || residents.length === 0) {
      console.log('No residents with email addresses found');
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    // Send email to each resident
    for (const resident of residents) {
      if (resident.email) {
        const emailSent = await sendNoticeEmail(
          resident.email,
          resident.owner_name || 'Resident',
          notice
        );

        if (emailSent) {
          successCount++;
        } else {
          failedCount++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('Error sending notice emails:', error);
    return { success: 0, failed: 0 };
  }
};

