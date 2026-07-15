import { Metadata } from 'next';
import { Mail, Sparkles, Bell, Gift } from 'lucide-react';
import NewsletterForm from '@/components/shared/NewsletterForm';

export const metadata: Metadata = {
  title: 'Subscribe',
  description: 'Subscribe to my newsletter to get updates on new posts and artwork.',
};

export default function SubscribePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="text-blue-600" size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Subscribe to My Newsletter
        </h1>
        <p className="text-xl text-gray-600">
          Get notified when I publish new content. No spam, unsubscribe anytime.
        </p>
      </div>

      {/* Newsletter Form */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-12">
        <NewsletterForm />
      </div>

      {/* Benefits */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Sparkles className="text-purple-600" size={24} />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">New Posts</h2>
          <p className="text-sm text-gray-600">
            Be the first to read new articles and stories.
          </p>
        </div>

        <div className="text-center p-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Bell className="text-green-600" size={24} />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">Art Updates</h2>
          <p className="text-sm text-gray-600">
            Get notified when new artwork is added to the gallery.
          </p>
        </div>

        <div className="text-center p-4">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Gift className="text-orange-600" size={24} />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">Exclusive Content</h2>
          <p className="text-sm text-gray-600">
            Occasional subscriber-only updates and insights.
          </p>
        </div>
      </div>

      {/* Alternative: Beehiiv Embed */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-center text-sm text-gray-500">
          Powered by Beehiiv. Your email is safe and will never be shared.
        </p>
      </div>
    </div>
  );
}
