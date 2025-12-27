import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSettings, FiMail, FiShield, FiUserPlus, FiSave, FiEdit2, FiTrash2 } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

// Set the base URL for API requests
const API_BASE_URL = 'http://localhost:5000/api';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies with the request
  headers: {
    'Content-Type': 'application/json',
  },
});

const AdminSettings = () => {
  const [email, setEmail] = useState('');
  const [websiteLogo, setWebsiteLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [admins, setAdmins] = useState([]);

  // Fetch admin list on component mount
  useEffect(() => {
    const fetchAdminList = async () => {
      try {
        // console.log('Fetching admin list from:', `${API_BASE_URL}/auth/admin/list`);
        const response = await api.get('/auth/admin/list');
        
        if (response.data?.success) {
          // Set the admins to state to display in the UI
          console.log('Fetched admins:', response.data.admins);
          setAdmins(response.data.admins);
          // console.log('Admin emails:', response.data.admins.map(a => a.email));
        } else {
          console.error('Unexpected response format:', response.data);
        }
      } catch (error) {
        console.error('Error fetching admin list:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        toast.error('Failed to load admin list');
      } finally {
        setIsLoadingAdmins(false);
      }
    };
    
    fetchAdminList();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    try {
      // Using /admin/add endpoint
      const response = await api.post('/auth/admin/add', { email: newAdminEmail });
      if (response.data.success) {
        toast.success('Admin access granted successfully');
        setShowAddAdminModal(false);
        setNewAdminEmail('');
        
        // Refresh the admin list using the new endpoint
        const adminsRes = await api.get('/auth/admin');
        if (adminsRes.data?.success) {
          setAdmins(adminsRes.data.admins);
        }
      } else {
        throw new Error(response.data.message || 'Failed to grant admin access');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error(error.response?.data?.message || 'Failed to add admin');
    } finally {
      setIsSaving(false);
    }
  };

  const openAddAdminModal = () => {
    setShowAddAdminModal(true);
    setNewAdminEmail('');
  };

  const closeAddAdminModal = () => {
    setShowAddAdminModal(false);
    setNewAdminEmail('');
  };

  const openEditModal = (admin) => {
    console.log('Opening edit modal for admin:', admin);
    setEditingAdmin(admin);
    setEditEmail(admin.email);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAdmin(null);
    setEditEmail('');
  };

  const handleEditAdmin = async () => {
    if (!editEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!editingAdmin || !editingAdmin._id) {
      console.error('No admin ID found:', editingAdmin);
      toast.error('Error: Admin ID not found');
      return;
    }

    console.log('Updating admin:', editingAdmin._id, 'with email:', editEmail);
    setIsSaving(true);
    try {
      const response = await api.put(`/auth/admin/${editingAdmin._id}`, { email: editEmail });
      if (response.data.success) {
        toast.success('Admin email updated successfully');
        closeEditModal();
        
        // Refresh the admin list
        const adminsRes = await api.get('/auth/admin/list');
        if (adminsRes.data?.success) {
          setAdmins(adminsRes.data.admins);
        }
      } else {
        throw new Error(response.data.message || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error(error.response?.data?.message || 'Failed to update admin');
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (admin) => {
    console.log('Opening delete modal for admin:', admin);
    setDeletingAdmin(admin);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingAdmin(null);
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin || !deletingAdmin._id) {
      console.error('No admin ID found:', deletingAdmin);
      toast.error('Error: Admin ID not found');
      return;
    }

    console.log('Deleting admin:', deletingAdmin._id);
    setIsSaving(true);
    try {
      const response = await api.delete(`/auth/admin/${deletingAdmin._id}`);
      if (response.data.success) {
        toast.success('Admin removed successfully');
        closeDeleteModal();
        
        // Refresh the admin list
        const adminsRes = await api.get('/auth/admin/list');
        if (adminsRes.data?.success) {
          setAdmins(adminsRes.data.admins);
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWebsiteLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateWebsiteLogo = async (e) => {
    e.preventDefault();
    if (!websiteLogo) {
      toast.error('Please select an image to upload');
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append('logo', websiteLogo);

    try {
      const response = await axios.put('/api/admin/website-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success('Website logo updated successfully');
        // Reset the file input and preview
        setWebsiteLogo(null);
        setLogoPreview('');
        document.getElementById('logo-upload').value = '';
      } else {
        throw new Error(response.data.message || 'Failed to update website logo');
      }
    } catch (error) {
      console.error('Error updating website logo:', error);
      toast.error(error.response?.data?.message || 'Failed to update website logo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              <FiSettings className="inline-block mr-2 h-7 w-7 text-indigo-600" />
              Admin Settings
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Manage administrator access and website settings
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Grant Admin Access Card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <FiShield className="mr-2 h-5 w-5 text-indigo-500" />
                  Manage Admin Access
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Grant or revoke administrator privileges
                </p>
              </div>
              <button
                onClick={openAddAdminModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiUserPlus className="mr-2 h-4 w-4" />
                Add New Admin
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="space-y-6">
                {/* Current Admins List */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Current Admins</h4>
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="divide-y divide-gray-200">
                      {admins.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {admins.map((admin, index) => (
                            <li key={admin._id || index} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0 flex-1">
                                  <FiMail className="flex-shrink-0 h-4 w-4 text-gray-500 mr-3" />
                                  <span className="text-sm font-medium text-gray-900 truncate">{admin.email}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => openEditModal(admin)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Edit admin email"
                                  >
                                    <FiEdit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(admin)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete admin"
                                  >
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-gray-500">No admin accounts found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Website Settings Card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <FiSettings className="mr-2 h-5 w-5 text-indigo-500" />
                Website Settings
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Configure your website's appearance and behavior
              </p>
            </div>
            <div className="px-6 py-6">
              <form onSubmit={handleUpdateWebsiteLogo} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Website Logo
                  </label>
                  <div className="mt-1 flex items-center">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-20 w-auto object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview('');
                            setWebsiteLogo(null);
                            document.getElementById('logo-upload').value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full">
                        <div className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg">
                          <div className="text-center">
                            <svg
                              className="mx-auto h-10 w-10 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="mt-4 flex text-sm text-gray-600">
                          <label
                            htmlFor="logo-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                          >
                            <span className="text-gray-400">Upload a file (disabled)</span>
                            <input
                              id="logo-upload"
                              name="logo-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleLogoChange}
                              disabled
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-400">Logo upload is currently disabled</p>
                      </div>
                    )}
                  </div>
                </div>
                {false && logoPreview && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : 'Upload Logo'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Admin</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="newAdminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="newAdminEmail"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md shadow-sm"
                    placeholder="Enter email address"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeAddAdminModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAdmin}
                disabled={isSaving || !newAdminEmail.trim()}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSaving || !newAdminEmail.trim() ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && editingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Admin Email</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="editAdminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="editAdminEmail"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md shadow-sm"
                    placeholder="Enter new email address"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditAdmin}
                disabled={isSaving || !editEmail.trim()}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSaving || !editEmail.trim() ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delete Admin</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to remove admin access for <strong className="text-gray-900">{deletingAdmin.email}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                disabled={isSaving}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSaving ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;