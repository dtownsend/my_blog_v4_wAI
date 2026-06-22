import { Metadata } from 'next';
import ResumeView from '@/components/resume/ResumeView';

export const metadata: Metadata = {
  title: 'Resume',
  description: 'View my professional experience, education, and skills.',
};

export default function ResumePage() {
  return <ResumeView />;
}
