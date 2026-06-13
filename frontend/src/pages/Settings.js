import React from 'react';
import { Lock, Shield, User as UserIcon } from 'lucide-react';
import Header from '../components/Header';
import ChangePasswordForm from '../components/ChangePasswordForm';
import BlockedAccountsCard from '../components/settings/BlockedAccountsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const Settings = () => {
  const user = getStoredUser();
  const username = user?.username || user?.name || '';
  const profileHref = username ? `/profile/${username}` : '/profile/board';
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10 pt-24" data-testid="settings-page">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-600" />
            Account Settings
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your security, account, and preferences.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-100">
                  <Lock className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Change password</CardTitle>
                  <CardDescription>
                    Enter your current password and choose a new one. You'll be logged out of all other devices for security.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <UserIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Profile</CardTitle>
                  <CardDescription>
                    Update your display name, bio, avatar, and social handles.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <a
                href={profileHref}
                className="inline-flex items-center text-sm font-medium text-cyan-600 hover:text-cyan-700"
                data-testid="settings-open-profile-link"
              >
                Go to profile →
              </a>
            </CardContent>
          </Card>

          <BlockedAccountsCard />
        </div>
      </div>
    </div>
  );
};

export default Settings;
