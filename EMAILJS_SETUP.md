# EmailJS Setup Guide

This application uses EmailJS to send email notifications to residents when notices are created.

## Setup Steps

### 1. Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account (200 emails/month free)
3. Verify your email address

### 2. Add Email Service

1. In EmailJS Dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.) or use **EmailJS** service
4. Follow the setup instructions for your chosen service
5. Note your **Service ID**

### 3. Create Email Template

1. Go to **Email Templates** in EmailJS Dashboard
2. Click **Create New Template**
3. Use this template structure:

**Subject:**
```
[{{notice_category}}] {{notice_title}}
```

**Content (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Times New Roman', serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 40px 20px; background-color: #f5f5f5;">
  
  <!-- Letterhead -->
  <div style="background: #ffffff; border: 2px solid #8c52ff; padding: 0; margin-bottom: 30px;">
    <!-- Letterhead Header -->
    <div style="background: linear-gradient(135deg, #8c52ff 0%, #a855f7 50%, #ec4899 100%); padding: 25px 30px; text-align: center; border-bottom: 3px solid #6d3fc7;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
        {{society_name}}
      </h1>
      <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; font-weight: 500; letter-spacing: 0.5px;">
        CO-OP HOUSING SOCIETY LTD.
      </p>
    </div>
    
    <!-- Letterhead Address Section -->
    <div style="padding: 20px 30px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="text-align: left; padding: 5px 0; color: #374151; font-size: 13px;">
            <strong>Address:</strong> {{society_address}}
          </td>
        </tr>
        <tr>
          <td style="text-align: left; padding: 5px 0; color: #374151; font-size: 13px;">
            <strong>Phone:</strong> {{society_phone}}
          </td>
        </tr>
      </table>
    </div>
  </div>
  
  <!-- Letter Content -->
  <div style="background: #ffffff; border: 2px solid #8c52ff; padding: 40px 50px; min-height: 400px;">
    
    <!-- Date and Reference -->
    <div style="margin-bottom: 30px; text-align: right;">
      <p style="margin: 0; color: #374151; font-size: 14px;">
        <strong>Date:</strong> {{notice_date}}
      </p>
    </div>
    
    <!-- Notice Title -->
    <div style="margin-bottom: 25px;">
      <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 22px; font-weight: bold; text-align: center; border-bottom: 2px solid #8c52ff; padding-bottom: 10px;">
        {{notice_title}}
      </h2>
      
      <!-- Priority and Category Badges -->
      <div style="text-align: center; margin: 15px 0;">
        <span style="background: #ef4444; color: white; padding: 6px 15px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 10px; display: inline-block;">
          {{notice_priority}}
        </span>
        <span style="background: #6b7280; color: white; padding: 6px 15px; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-block;">
          {{notice_category}}
        </span>
      </div>
    </div>
    
    <!-- Salutation -->
    <div style="margin-bottom: 20px;">
      <p style="margin: 0; color: #374151; font-size: 14px;">
        <strong>To,</strong><br>
        All Members / Residents
      </p>
    </div>
    
    <!-- Subject Line -->
    <div style="margin-bottom: 20px;">
      <p style="margin: 0; color: #374151; font-size: 14px;">
        <strong>Subject:</strong> {{notice_title}}
      </p>
    </div>
    
    <!-- Notice Dated -->
    <div style="margin-bottom: 20px;">
      <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 500;">
        <strong>Notice (Dated: {{notice_date}})</strong>
      </p>
    </div>
    
    <!-- Introductory Paragraph -->
    <div style="margin-bottom: 25px; text-align: justify;">
      <p style="margin: 0 0 15px 0; color: #1f2937; font-size: 14px; line-height: 1.8;">
        This is to inform all society members that the following notice is being issued for your kind information and necessary action. Members are requested to read the notice carefully and comply with the instructions mentioned herein.
      </p>
    </div>
    
    <!-- Letter Body Content -->
    <div style="margin-bottom: 30px; text-align: justify;">
      <p style="margin: 0 0 15px 0; color: #1f2937; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">
        {{notice_content}}
      </p>
    </div>
    
    <!-- Closing -->
    <div style="margin-top: 40px;">
      <p style="margin: 0 0 5px 0; color: #374151; font-size: 14px;">
        Thanking you,
      </p>
      <p style="margin: 15px 0 5px 0; color: #374151; font-size: 14px;">
        <strong>{{notice_author}}</strong>
      </p>
      <p style="margin: 5px 0 0 0; color: #374151; font-size: 14px;">
        {{society_name}}
      </p>
    </div>
    
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; color: #6b7280; font-size: 11px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
    <p style="margin: 3px 0;">
      This is an automated notification. Please do not reply to this email.
    </p>
    <p style="margin: 3px 0;">
      For queries, please contact the society office at {{society_phone}}
    </p>
  </div>
  
</body>
</html>
```

4. **IMPORTANT: Configure the "To Email" field**
   - In the template editor, look for the **"To Email"** field (usually at the top of the template settings)
   - Set it to: `{{to_email}}`
   - This is **critical** - without this, you'll get "recipients address is empty" error
   - The "To Email" field tells EmailJS where to send the email

5. Save the template and note your **Template ID**

### 4. Get Public Key

1. Go to **Account** → **General** in EmailJS Dashboard
2. Find your **Public Key** (starts with a letter, e.g., `abc123xyz`)

### 5. Configure Environment Variables

Create or update your `.env` file in the project root:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Example:**
```env
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=abc123xyz456
```

### 6. Restart Development Server

After adding environment variables, restart your development server:

```bash
npm run dev
```

## Template Variables

The email template uses these variables (automatically provided):

- `{{to_email}}` - Recipient email address
- `{{to_name}}` - Recipient name
- `{{notice_title}}` - Notice title
- `{{notice_content}}` - Notice content
- `{{notice_date}}` - Formatted notice date
- `{{notice_priority}}` - Notice priority (High/Medium/Low)
- `{{notice_category}}` - Notice category
- `{{notice_author}}` - Author name
- `{{society_name}}` - Society name
- `{{society_address}}` - Society address
- `{{society_phone}}` - Society phone number

## Testing

1. Create a test notice in the Notice Board
2. Check the toast notification for email sending status
3. Verify emails are received by residents

## Troubleshooting

- **Emails not sending**: Check that all environment variables are set correctly
- **Template errors**: Verify template variables match exactly (case-sensitive)
- **Rate limiting**: Free tier allows 200 emails/month
- **Service errors**: Check EmailJS dashboard for service status

## Current Status

- ✅ EmailJS package installed
- ✅ Email service created
- ✅ Integrated in NoticeBoard
- ⏳ Configuration: Add environment variables (see Step 5)

