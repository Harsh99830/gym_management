import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Form, Input, InputNumber, message, Modal, Spin } from 'antd';
import { CreditCardOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllPlans, createPlan, updatePlan, deletePlan } from '../utils/api';

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deletingPlanId, setDeletingPlanId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const plansRes = await getAllPlans();
      setPlans(plansRes || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      message.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleAddPlan = async (values) => {
    try {
      await createPlan(values);
      message.success('Plan created successfully');
      setShowAddPlanModal(false);
      form.resetFields();
      await fetchPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      message.error(error.response?.data?.message || 'Failed to create plan');
    }
  };

  const handleUpdatePlan = async (values) => {
    try {
      await updatePlan(editingPlan._id, values);
      message.success('Plan updated successfully');
      setShowEditPlanModal(false);
      editForm.resetFields();
      setEditingPlan(null);
      await fetchPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      message.error(error.response?.data?.message || 'Failed to update plan');
    }
  };

  const openDeleteModal = (planId) => {
    setDeletingPlanId(planId);
    setShowDeleteModal(true);
  };

  const handleDeletePlan = async () => {
    if (!deletingPlanId) return;
    
    try {
      setDeleteLoading(true);
      await deletePlan(deletingPlanId);
      message.success('Plan deleted successfully');
      setShowDeleteModal(false);
      setDeletingPlanId(null);
      await fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      message.error(error.response?.data?.message || 'Failed to delete plan');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    const formValues = {
      ...plan,
      planType: plan.planType
    };
    editForm.setFieldsValue(formValues);
    setShowEditPlanModal(true);
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
        <span className="ml-4 text-xl">Loading plans...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Plans Management</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowAddPlanModal(true)}
          >
            Add Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card
              key={plan._id}
              title={plan.planType.toUpperCase()}
              className="shadow-md"
              actions={[
                <EditOutlined 
                  key="edit" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(plan);
                  }} 
                  style={{ fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}
                />,
                <DeleteOutlined
                  key="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(plan._id);
                  }}
                  style={{ color: '#ff4d4f', fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}
                />
              ]}
            >
              <div className="space-y-3">
                <p className="text-lg font-semibold">₹{plan.amount}</p>
                <p className="text-gray-600">{plan.duration} month{plan.duration > 1 ? 's' : ''}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Plan Modal */}
      <Modal
        title="Add New Plan"
        open={showAddPlanModal}
        onCancel={() => {
          setShowAddPlanModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Create"
      >
        <Form form={form} onFinish={handleAddPlan} layout="vertical">
          <Form.Item
            name="planType"
            label="Plan Name"
            rules={[{ required: true, message: 'Please enter plan name' }]}
          >
            <Input placeholder="e.g., Basic, Premium, Pro" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount (₹)"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item
            name="duration"
            label="Duration (months)"
            rules={[{ required: true, message: 'Please enter duration' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        title="Edit Plan"
        open={showEditPlanModal}
        onCancel={() => {
          setShowEditPlanModal(false);
          editForm.resetFields();
          setEditingPlan(null);
        }}
        onOk={() => editForm.submit()}
        okText="Save Changes"
      >
        <Form form={editForm} onFinish={handleUpdatePlan} layout="vertical">
          <Form.Item
            name="planType"
            label="Plan Name"
            rules={[{ required: true, message: 'Please enter plan name' }]}
          >
            <Input placeholder="e.g., Basic, Premium, Pro" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount (₹)"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item
            name="duration"
            label="Duration (months)"
            rules={[{ required: true, message: 'Please enter duration' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Plan"
        open={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingPlanId(null);
        }}
        onOk={handleDeletePlan}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true, loading: deleteLoading }}
        cancelButtonProps={{ disabled: deleteLoading }}
      >
        <p>Are you sure you want to delete this plan? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default PlansPage;
