import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Select, InputNumber, message, Modal, Spin } from 'antd';
import { TagOutlined, PlusOutlined, EditOutlined, DeleteOutlined, PercentageOutlined } from '@ant-design/icons';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../utils/api';

const { Option } = Select;

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [showEditCouponModal, setShowEditCouponModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deletingCouponId, setDeletingCouponId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await getAllCoupons();
      setCoupons(response || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      message.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async (values) => {
    try {
      const { code, discountType, discountValue } = values;
      const discount = discountValue.toString();
      
      await createCoupon({ code, discount, discountType });
      message.success('Coupon created successfully');
      setShowAddCouponModal(false);
      form.resetFields();
      await fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      message.error(error.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleUpdateCoupon = async (values) => {
    try {
      const { code, discountType, discountValue } = values;
      const discount = discountValue.toString();
      
      await updateCoupon(editingCoupon._id, { code, discount, discountType });
      message.success('Coupon updated successfully');
      setShowEditCouponModal(false);
      editForm.resetFields();
      setEditingCoupon(null);
      await fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon:', error);
      message.error(error.response?.data?.message || 'Failed to update coupon');
    }
  };

  const openDeleteModal = (couponId) => {
    setDeletingCouponId(couponId);
    setShowDeleteModal(true);
  };

  const handleDeleteCoupon = async () => {
    if (!deletingCouponId) return;
    
    try {
      setDeleteLoading(true);
      await deleteCoupon(deletingCouponId);
      message.success('Coupon deleted successfully');
      setShowDeleteModal(false);
      setDeletingCouponId(null);
      await fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      message.error(error.response?.data?.message || 'Failed to delete coupon');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    editForm.setFieldsValue({
      code: coupon.code,
      discountType: coupon.discountType || 'amount',
      discountValue: parseFloat(coupon.discount)
    });
    setShowEditCouponModal(true);
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
        <span className="ml-4 text-xl">Loading coupons...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Coupons Management</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowAddCouponModal(true)}
          >
            Add Coupon
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map(coupon => (
            <Card
              key={coupon._id}
              title={coupon.code}
              className="shadow-md"
              actions={[
                <EditOutlined 
                  key="edit" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(coupon);
                  }} 
                  style={{ fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}
                />,
                <DeleteOutlined
                  key="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(coupon._id);
                  }}
                  style={{ color: '#ff4d4f', fontSize: '16px', padding: '0 8px', cursor: 'pointer' }}
                />
              ]}
            >
              <div className="space-y-3">
                <p className="text-lg font-semibold">
                  {coupon.discountType === 'percentage' ? (
                    <span className="flex items-center gap-1">
                      <PercentageOutlined />
                      {coupon.discount}%
                    </span>
                  ) : (
                    <span>₹{coupon.discount}</span>
                  )}
                </p>
                <p className="text-gray-600">
                  {coupon.discountType === 'percentage' ? 'Percentage Discount' : 'Fixed Amount'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Coupon Modal */}
      <Modal
        title="Add New Coupon"
        open={showAddCouponModal}
        onCancel={() => {
          setShowAddCouponModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Create"
      >
        <Form form={form} onFinish={handleAddCoupon} layout="vertical">
          <Form.Item
            name="code"
            label="Coupon Code"
            rules={[{ required: true, message: 'Please enter coupon code' }]}
          >
            <Input 
              placeholder="e.g., GYMFIT100, SAVE20" 
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </Form.Item>
          <Form.Item
            name="discountType"
            label="Discount Type"
            rules={[{ required: true, message: 'Please select discount type' }]}
          >
            <Select placeholder="Select discount type">
              <Option value="percentage">Percentage (%)</Option>
              <Option value="amount">Fixed Amount (₹)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="discountValue"
            label="Discount Value"
            rules={[{ required: true, message: 'Please enter discount value' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="e.g., 20 for 20% or 100 for ₹100"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Coupon Modal */}
      <Modal
        title="Edit Coupon"
        open={showEditCouponModal}
        onCancel={() => {
          setShowEditCouponModal(false);
          editForm.resetFields();
          setEditingCoupon(null);
        }}
        onOk={() => editForm.submit()}
        okText="Save Changes"
      >
        <Form form={editForm} onFinish={handleUpdateCoupon} layout="vertical">
          <Form.Item
            name="code"
            label="Coupon Code"
            rules={[{ required: true, message: 'Please enter coupon code' }]}
          >
            <Input 
              placeholder="e.g., GYMFIT100, SAVE20" 
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </Form.Item>
          <Form.Item
            name="discountType"
            label="Discount Type"
            rules={[{ required: true, message: 'Please select discount type' }]}
          >
            <Select placeholder="Select discount type">
              <Option value="percentage">Percentage (%)</Option>
              <Option value="amount">Fixed Amount (₹)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="discountValue"
            label="Discount Value"
            rules={[{ required: true, message: 'Please enter discount value' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="e.g., 20 for 20% or 100 for ₹100"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Coupon"
        open={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingCouponId(null);
        }}
        onOk={handleDeleteCoupon}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true, loading: deleteLoading }}
        cancelButtonProps={{ disabled: deleteLoading }}
      >
        <p>Are you sure you want to delete this coupon? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default CouponsPage;
