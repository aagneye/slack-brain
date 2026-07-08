import { redirect } from 'next/navigation';

/** Legacy route — connections live in the brain dashboard sidebar. */
export default function ConnectorsRedirectPage() {
  redirect('/brain/connectors');
}
