import { google } from 'googleapis';
import { cookies } from 'next/headers';

/**
 * Returns an authenticated OAuth2 client using cookies (access + refresh tokens).
 * Refreshes the access token if only a refresh token is present.
 */
export async function getAuthenticatedOAuth2Client() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('google_access_token')?.value;
  const refreshToken = cookieStore.get('google_refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    throw new Error('Not authenticated. Please log in with Google.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials({
    access_token: accessToken || undefined,
    refresh_token: refreshToken || undefined,
  });

  if (refreshToken && !accessToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
        cookieStore.set('google_access_token', credentials.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
        oauth2Client.setCredentials(credentials);
      }
    } catch (refreshError) {
      console.error('Error refreshing access token:', refreshError);
      throw new Error('Failed to refresh access token. Please log in again.');
    }
  }

  return oauth2Client;
}

export interface GoogleUserProfile {
  name?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
}

/**
 * Fetches the current user's profile (name, email) from Google's userinfo API.
 * Requires userinfo.profile and userinfo.email scopes. Returns empty object on failure.
 */
export async function getCurrentUserProfile(): Promise<GoogleUserProfile> {
  try {
    const oauth2Client = await getAuthenticatedOAuth2Client();
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return {
      name: data.name ?? undefined,
      givenName: data.given_name ?? undefined,
      familyName: data.family_name ?? undefined,
      email: data.email ?? undefined,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {};
  }
}

/**
 * Fetches a person's profile (name) from Google People API by email address.
 * Attempts to find the person in contacts or directory. Returns undefined if not found.
 * Requires appropriate People API scopes (contacts.readonly or directory access).
 */
export async function getPersonNameByEmail(email: string): Promise<string | undefined> {
  try {
    const oauth2Client = await getAuthenticatedOAuth2Client();
    const people = google.people({ version: 'v1', auth: oauth2Client });

    // Try method 1: Search in contacts
    try {
      const searchResponse = await people.people.searchContacts({
        query: email,
        readMask: 'names,emailAddresses',
      });

      const results = searchResponse.data.results;
      if (results && results.length > 0) {
        const person = results[0].person;
        if (person?.names && person.names.length > 0) {
          const name = person.names[0];
          return name.displayName || name.givenName || undefined;
        }
      }
    } catch (contactError) {
      // Contact search failed, try directory search (silently fail)
    }

    // Try method 2: Search in directory (for organization contacts)
    try {
      const directoryResponse = await people.people.searchDirectoryPeople({
        query: email,
        readMask: 'names,emailAddresses',
        sources: ['DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE', 'DIRECTORY_SOURCE_TYPE_DOMAIN_CONTACT'],
      });

      const peopleResults = directoryResponse.data.people;
      if (peopleResults && peopleResults.length > 0) {
        const person = peopleResults[0];
        if (person?.names && person.names.length > 0) {
          const name = person.names[0];
          return name.displayName || name.givenName || undefined;
        }
      }
    } catch (directoryError) {
      // Directory search failed (silently fail)
    }

    return undefined;
  } catch (error) {
    console.error('Error fetching person name by email:', error);
    return undefined;
  }
}
