/**
 * UNIVERSAL CONTACT FORM COMPONENT
 *
 * Uses Web3Forms for serverless form submission.
 * One access key works across ALL sites.
 * Submissions go to: JBFeedbackTool@gmail.com
 *
 * Usage:
 *   import { ContactForm } from '@/components/ContactForm';
 *   <ContactForm siteName="SalaryScout" />
 *
 * Features:
 * - No backend required (Web3Forms handles delivery)
 * - Works on any domain
 * - Dark mode support
 * - Mobile responsive
 * - Accessible
 */

'use client';

import { useState } from 'react';

// Universal Web3Forms access key - works for all sites
const WEB3FORMS_ACCESS_KEY = 'ceaf1d88-37ad-4d3f-b188-6636cd941562';

interface ContactFormProps {
  siteName: string;
  pageContext?: string;  // Optional: Which page the message is from
  className?: string;
}

export function ContactForm({
  siteName,
  pageContext,
  className = ''
}: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className={`rounded-lg border bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 p-6 text-center ${className}`}>
        <svg
          className="w-12 h-12 text-green-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
          Thank You!
        </h3>
        <p className="text-green-700 dark:text-green-300">
          Your message has been sent. We appreciate you taking the time to reach out.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-green-600 dark:text-green-400 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Hidden Web3Forms fields */}
      <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} />
      <input type="hidden" name="subject" value={`Contact from ${siteName}`} />
      <input type="hidden" name="from_name" value={siteName} />
      {pageContext && (
        <input type="hidden" name="page_context" value={pageContext} />
      )}
      {/* Honeypot for spam prevention */}
      <input type="checkbox" name="botcheck" className="hidden" />

      <div className="space-y-4">
        <div>
          <label
            htmlFor="message-type"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Message Type
          </label>
          <select
            id="message-type"
            name="message_type"
            required
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a type...</option>
            <option value="general">General Inquiry</option>
            <option value="bug">Bug Report</option>
            <option value="suggestion">Suggestion</option>
            <option value="data-issue">Data Issue</option>
            <option value="feature">Feature Request</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Your Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind, report an issue, or ask a question..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="email"
            id="contact-email"
            name="email"
            placeholder="your@email.com"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Only if you'd like us to follow up
          </p>
        </div>

        {status === 'error' && (
          <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
            Something went wrong. Please try again.
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-4 py-2 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {status === 'submitting' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending...
            </span>
          ) : (
            'Send Message'
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * MINIMAL INLINE CONTACT WIDGET
 *
 * For embedding in footers or sidebars.
 * Just a textarea and submit button.
 */
export function ContactWidget({
  siteName,
  className = ''
}: {
  siteName: string;
  className?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('submitting');

    const formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `Quick Message from ${siteName}`);
    formData.append('message', message);

    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });
      setStatus('success');
      setMessage('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('idle');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Quick message..."
        disabled={status !== 'idle'}
        className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={status !== 'idle' || !message.trim()}
        className="rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-3 py-1.5 text-sm text-white font-medium transition-colors"
      >
        {status === 'success' ? '✓' : status === 'submitting' ? '...' : 'Send'}
      </button>
    </form>
  );
}
