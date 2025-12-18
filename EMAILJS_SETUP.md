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
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8c52ff 0%, #a855f7 50%, #ec4899 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">{{society_name}}</h1>
    <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">CO-OP HOUSING SOCIETY LTD.</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #1f2937; margin-top: 0; font-size: 22px; border-bottom: 2px solid #8c52ff; padding-bottom: 10px;">
        {{notice_title}}
      </h2>
      
      <div style="margin: 15px 0;">
        <span style="background: #ef4444; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
          {{notice_priority}}
        </span>
        <span style="background: #e5e7eb; color: #374151; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-left: 10px;">
          {{notice_category}}
        </span>
      </div>
      
      <div style="color: #6b7280; font-size: 14px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Date:</strong> {{notice_date}}</p>
        <p style="margin: 5px 0;"><strong>Published by:</strong> {{notice_author}}</p>
      </div>
      
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #8c52ff;">
        <p style="margin: 0; color: #374151; white-space: pre-wrap;">{{notice_content}}</p>
      </div>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 5px 0;">This is an automated notification from</p>
      <p style="margin: 5px 0;"><strong>{{society_name}}</strong></p>
      <p style="margin: 5px 0;">{{society_address}}</p>
      <p style="margin: 5px 0;">Tel: {{society_phone}}</p>
    </div>
  </div>
</body>
</html>
```

4. Save the template and note your **Template ID**

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

