import React, { useContext, useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import AppContext from '../AppContext';

const ProfilePage = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { username, role, handleApiRequest, handleUpdateUser, handleShowNoti } = useContext(AppContext);

  const handleChangePassword = async () => {
    const endpoint = 'user_change_password';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = { oldPassword, newPassword };

    try {
      const responseData = await handleApiRequest(endpoint, method, headers, body);
      handleUpdateUser(responseData);
      handleShowNoti({
        level: 'success',
        message: responseData.message
      });
      setOldPassword('');
      setNewPassword('');
    } catch (error) {}
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col xs={12} sm={8} md={6} lg={4}>
          <div className="text-center mb-4">
            <h2>Profile</h2>
          </div>
          <div className="mb-4">
            <strong>Username:</strong> {username}
          </div>
          <div className="mb-4">
            <strong>Role:</strong> {role}
          </div>
            <Form onSubmit={(e) => {
                e.preventDefault(); // Prevents the default form submission behavior
                handleChangePassword();
                }}>
                <Form.Group controlId="formOldPassword" className="mt-4">
                    <Form.Label><strong>Old Password</strong></Form.Label>
                    <Form.Control
                    type="password"
                    placeholder="Enter old password"
                    value={oldPassword}
                    required
                    onChange={(e) => setOldPassword(e.target.value)}
                    />
                </Form.Group>

                <Form.Group controlId="formNewPassword" className="mt-4">
                    <Form.Label><strong>New Password</strong></Form.Label>
                    <Form.Control
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    />
                </Form.Group>

                <div className="text-center mt-4">
                    <Button variant="primary" type="submit" block>
                    Change Password
                    </Button>
                </div>
            </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;
