import Image from 'next/image';
import { MapPin, Linkedin, Mail, Download } from 'lucide-react';
import { getResumeItems, getSkills, getProfile, ProfileEntry } from '@/lib/contentful';
import ResumeSection from '@/components/resume/ResumeSection';
import SkillsSection from '@/components/resume/SkillsSection';
import { SITE_CONFIG } from '@/lib/constants';

export default async function ResumeView() {
  let resumeItems: Awaited<ReturnType<typeof getResumeItems>> = [];
  let skills: Awaited<ReturnType<typeof getSkills>> = [];
  let profile: ProfileEntry | null = null;

  try {
    [resumeItems, skills, profile] = await Promise.all([
      getResumeItems(),
      getSkills(),
      getProfile(),
    ]);
  } catch (error) {
    console.error('Failed to fetch resume data:', error);
  }

  const profilePictureUrl = profile?.fields?.profilePicture?.fields?.file?.url
    ? profile.fields.profilePicture.fields.file.url.startsWith('//')
      ? `https:${profile.fields.profilePicture.fields.file.url}`
      : profile.fields.profilePicture.fields.file.url
    : null;

  const resumePdfUrl = profile?.fields?.resumePdf?.fields?.file?.url
    ? profile.fields.resumePdf.fields.file.url.startsWith('//')
      ? `https:${profile.fields.resumePdf.fields.file.url}`
      : profile.fields.resumePdf.fields.file.url
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Sidebar */}
        <aside className="md:w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Profile Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              {/* Profile Picture - Centered */}
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden relative">
                  {profilePictureUrl ? (
                    <Image
                      src={profilePictureUrl}
                      alt={profile?.fields?.name || SITE_CONFIG.author}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                      {(profile?.fields?.name || SITE_CONFIG.author).charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Name - Centered */}
              <h1 className="text-2xl font-bold text-gray-900 text-center">
                {profile?.fields?.name || SITE_CONFIG.author}
              </h1>

              {/* Title - Centered */}
              <p className="text-gray-600 mt-1 text-center">
                {profile?.fields?.title || 'Software Developer'}
              </p>

              {/* Location - Centered */}
              <div className="flex items-center gap-2 text-gray-600 text-sm justify-center mt-3">
                <MapPin size={16} />
                <span>{profile?.fields?.location || 'San Francisco, CA'}</span>
              </div>

              {/* Social Links - Centered */}
              <div className="flex gap-3 justify-center mt-4">
                {SITE_CONFIG.social.linkedin && (
                  <a
                    href={SITE_CONFIG.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={20} />
                  </a>
                )}
                {SITE_CONFIG.social.email && (
                  <a
                    href={`mailto:${SITE_CONFIG.social.email}`}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Email"
                  >
                    <Mail size={20} />
                  </a>
                )}
              </div>

              {/* Bio - Justified */}
              <p className="text-gray-600 text-sm text-justify mt-4 pt-4 border-t border-gray-100">
                {profile?.fields?.bio || 'Passionate about building great software and creating meaningful experiences.'}
              </p>
            </div>

            {/* Skills */}
            {skills.length > 0 && <SkillsSection skills={skills} />}

            {/* Download PDF */}
            {resumePdfUrl && (
              <a
                href={resumePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={18} />
                Download PDF
              </a>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {resumeItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-600">Resume content coming soon.</p>
            </div>
          ) : (
            <>
              <ResumeSection items={resumeItems} type="work" />
              <ResumeSection items={resumeItems} type="education" />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
