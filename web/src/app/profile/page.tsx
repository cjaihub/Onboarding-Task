'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { UserCircleIcon, CameraIcon, BriefcaseIcon, AtSymbolIcon, PhoneIcon, IdentificationIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    role: '',
    avatar_url: '',
    phone_number: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.profile?.bio || '',
        role: user.profile?.role || '',
        avatar_url: user.profile?.avatar_url || '',
        phone_number: user.profile?.phone_number || '',
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-slate-900 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full bg-slate-900 items-center justify-center">
        <p className="text-slate-400">Please log in to view your profile.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        profile: {
          bio: formData.bio,
          role: formData.role,
          avatar_url: formData.avatar_url,
          phone_number: formData.phone_number,
        }
      });
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = `${formData.first_name?.[0] || ''}${formData.last_name?.[0] || ''}`.toUpperCase() || user.username[0].toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">My Profile</h1>
              <p className="text-slate-400 mt-1">Manage your account settings and preferences.</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors border border-slate-700/50"
              >
                Edit Profile
              </button>
            )}
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
          {successMsg && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">{successMsg}</div>}

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-10">
              
              {/* Avatar Column */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-700 flex items-center justify-center shadow-xl">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-slate-300">{initials}</span>
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <CameraIcon className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="w-full">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Avatar URL</label>
                    <input
                      type="text"
                      name="avatar_url"
                      value={formData.avatar_url}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                )}
                <div className="text-center pt-2">
                  <h2 className="text-xl font-bold text-white">{formData.first_name} {formData.last_name}</h2>
                  <p className="text-red-400 font-medium text-sm">{formData.role || 'Member'}</p>
                </div>
              </div>

              {/* Form Column */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-400 mb-2">
                      <IdentificationIcon className="w-4 h-4 mr-2" /> First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                      />
                    ) : (
                      <p className="text-white bg-slate-900/50 px-4 py-3 rounded-xl border border-transparent">{formData.first_name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-400 mb-2">
                      <IdentificationIcon className="w-4 h-4 mr-2 opacity-0" /> Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                      />
                    ) : (
                      <p className="text-white bg-slate-900/50 px-4 py-3 rounded-xl border border-transparent">{formData.last_name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-400 mb-2">
                      <AtSymbolIcon className="w-4 h-4 mr-2" /> Username
                    </label>
                    <p className="text-slate-500 bg-slate-900/50 px-4 py-3 rounded-xl cursor-not-allowed">@{user.username}</p>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-400 mb-2">
                      <UserCircleIcon className="w-4 h-4 mr-2" /> Email
                    </label>
                    <p className="text-slate-500 bg-slate-900/50 px-4 py-3 rounded-xl cursor-not-allowed">{user.email}</p>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-400 mb-2">
                      <BriefcaseIcon className="w-4 h-4 mr-2" /> Job Title / Role
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                      />
                    ) : (
                      <p className="text-white bg-slate-900/50 px-4 py-3 rounded-xl border border-transparent">{formData.role || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-slate-400 mb-2">
                      <PhoneIcon className="w-4 h-4 mr-2" /> Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                      />
                    ) : (
                      <p className="text-white bg-slate-900/50 px-4 py-3 rounded-xl border border-transparent">{formData.phone_number || '-'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Biography</label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  ) : (
                    <p className="text-white bg-slate-900/50 px-4 py-3 rounded-xl border border-transparent min-h-[100px]">
                      {formData.bio || 'No biography provided.'}
                    </p>
                  )}
                </div>

                {isEditing && (
                  <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-700/50">
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="px-6 py-2.5 rounded-lg font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50 flex items-center"
                    >
                      {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
