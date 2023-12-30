import React, { useState, useContext } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AppContext from '../AppContext';

const SignupForm = ({ onSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const {handleApiRequest, handleUpdateUser} = useContext(AppContext);

  const handleSignup = async () => {
    const endpoint = 'register';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = { username, password };

    try {
      const responseData = await handleApiRequest(endpoint, method, headers, body);
      handleUpdateUser(responseData); // Pass the token to the parent component
    } catch(error) {}
  };

  return (
    <Container>
      <Row className="justify-content-center align-items-center vh-100">
        <Col xs={12} sm={8} md={6} lg={4}>
          <div className="text-center mb-4">
            <h2>Signup</h2>
          </div>
          <Form>
            <Form.Group controlId="formBasicUsername" className="mt-4">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="formBasicPassword" className="mt-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            <div className="text-center mt-4">
            <Button variant="primary" onClick={handleSignup} block>
              Signup
            </Button>
            </div>
          </Form>
          <div className="text-center mt-2">
            <Link to="/login">Back to Login</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default SignupForm;
