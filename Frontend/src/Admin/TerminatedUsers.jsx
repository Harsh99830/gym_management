import React, { useState } from 'react';
import { Table, Button, Tooltip, Card, Tag, Typography, Space } from 'antd';
import { updateUserStatus } from '../utils/api';
import { UserOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const TerminatedUsers = ({ users = [], onReinstate }) => {
  const [loadingIds, setLoadingIds] = useState(new Set());

  const setLoading = (id, isLoading) => {
    setLoadingIds(prev => {
      const next = new Set(prev);
      if (isLoading) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleSetInactive = async (user) => {
    if (!user?._id) return;
    if (!confirm(`Set ${user.name || 'this user'} to Inactive?`)) return;
    try {
      setLoading(user._id, true);
      await updateUserStatus(user._id, 'inactive');
      if (typeof onReinstate === 'function') await onReinstate();
    } catch (e) {
      alert(e.message || 'Failed to set user inactive');
    } finally {
      setLoading(user._id, false);
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
            <UserOutlined />
          </div>
          <div>
            <div className="font-medium text-gray-900">{record.name || 'No Name'}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <MailOutlined className="mr-1" />
              {record.email || 'No email'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-600 mb-1">
            <PhoneOutlined className="mr-2" />
            {record.mobile || record.phone || 'N/A'}
          </div>
          {record.source && (
            <Tag color={record.source.toLowerCase() === 'manual' ? 'blue' : 'default'} className="text-xs">
              {record.source}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = (record.accountStatus || '').toLowerCase();
        const statusConfig = {
          terminated: { color: 'red', label: 'Terminated' },
          inactive: { color: 'orange', label: 'Inactive' },
          active: { color: 'green', label: 'Active' },
        };
        const config = statusConfig[status] || { color: 'default', label: 'Unknown' };
        
        return (
          <Tag color={config.color} className="capitalize">
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Termination Date',
      key: 'terminatedOn',
      render: (_, record) => {
        const d = record.updatedAt ? new Date(record.updatedAt) : record.terminatedAt ? new Date(record.terminatedAt) : null;
        return d && !isNaN(d) ? (
          <div className="flex items-center text-sm text-gray-600">
            <ClockCircleOutlined className="mr-1" />
            {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        ) : '—';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          size="small"
          loading={loadingIds.has(record._id)}
          onClick={() => handleSetInactive(record)}
          className="hover:bg-blue-50"
        >
          Set to Inactive
        </Button>
      ),
    },
  ];

  return (
    <Card 
      className="shadow-sm border-0"
      title={
        <div className="flex justify-between items-center">
          <div>
            <Title level={4} className="m-0">Terminated Users</Title>
            <Text type="secondary" className="text-sm">
              {users.length} user{users.length !== 1 ? 's' : ''} terminated
            </Text>
          </div>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        pagination={{ pageSize: 8, showSizeChanger: false }}
        scroll={{ x: 'max-content' }}
        className="[&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:text-gray-500 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-tbody>tr>td]:text-gray-700 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr:hover>td]:bg-blue-50"
        locale={{
          emptyText: (
            <div className="py-12 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <Text type="secondary">No terminated users found</Text>
            </div>
          )
        }}
      />
    </Card>
  );
};

export default TerminatedUsers;
