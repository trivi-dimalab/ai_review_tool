import React, { Component } from 'react';
import { Table, Button, Form, Row, Col } from 'react-bootstrap';
import AppContext from '../AppContext';

class AdminPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      newUser: {
        username: '',
        password: '', // Replace 'role' with 'password'
      },
      passwordInputs: {},
    };
  }

  static contextType = AppContext

  componentDidMount() {
    const endpoint = 'get_users';
    const method = 'GET';
    const headers = {};
    const body = null;

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState({ users: responseData.users });
      })
      .catch((error) => {});
  }

  handleActiveUser = (userName, userId, status) => {
    const modalInfo = {
      level: 'update',
      message: `Do you want to ${status ? 'active' : 'deactive'} account of ${userName}?`,
      onYes: () => this.updateStatusRequest(userId, status)
    };
    this.context.handleShowModal(modalInfo);

  }

  updateStatusRequest = (userId, status) => {
    const endpoint = 'change_status_user';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = {
      user_id: userId,
      new_status: status,
    };

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState({users: responseData.users});
        this.context.handleShowNoti({
          level: 'success',
          message: responseData.message
        })
      })
      .catch((error) => {});
  };

  handleAddUser = (e) => {
    e.preventDefault();

    const modalInfo = {
      level: 'update',
      message: 'Do you want to add a new user ?',
      onYes: () => this.addUserRequest()
    };

    this.context.handleShowModal(modalInfo);
  }

  addUserRequest = () => {
    const endpoint = 'add_user';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = this.state.newUser;

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState({users: responseData.users});
        this.context.handleShowNoti({
          level: 'success', 
          message: responseData.message
        });
      })
      .catch((error) => {});
  };

  handleUpdatePassword = (e, userName, userId) => {
    e.preventDefault();

    const modalInfo = {
      level: 'update',
      message: `Do you want to update password of ${userName}?`,
      onYes: () => this.updatePassRequest(userId)
    };

    this.context.handleShowModal(modalInfo);
  }

  updatePassRequest = (userId) => {
    const endpoint = 'admin_change_password';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = {
      user_id: userId,
      new_password: this.state.passwordInputs[userId].newPassword
    };

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState((prevState) => ({
          passwordInputs: {
            ...prevState.passwordInputs,
            [userId]: {
              isVisible: !prevState.passwordInputs[userId]?.isVisible,
              newPassword: '',
            },
          },
          users: responseData.users
        }));
        this.context.handleShowNoti({
          level: 'success', 
          message: responseData.message
        });
      })
      .catch((error) => {});

  };

  handleChangePassword = (userId) => {
    // After updating password, hide the input section
    this.setState((prevState) => ({
      passwordInputs: {
        ...prevState.passwordInputs,
        [userId]: {
          isVisible: true,
          newPassword: '',
        },
      },
    }));
  };

  handleInputChange = (e, userId) => {
    const { name, value } = e.target;

    if (userId == 'newUser') {
      this.setState((prevState) => ({
        newUser: {
          ...prevState.newUser,
          [name]: value,
        },
      }));
    } else {
      this.setState((prevState) => ({
        passwordInputs: {
          ...prevState.passwordInputs,
          [userId]: {
            ...prevState.passwordInputs[userId],
            newPassword: value,
          },
        },
      }));
    }
  };

  render() {
    const { users, passwordInputs } = this.state;

    return (
      <div>
        <h1>Admin Page</h1>
        <Form className='mb-3' onSubmit={this.handleAddUser}>
          <Row>
            <Col>
              <Form.Control
                type="text"
                placeholder="Username"
                name="username"
                required
                value={this.state.newUser.username}
                onChange={(e) => this.handleInputChange(e, 'newUser')}
              />
            </Col>
            <Col>
              <Form.Control
                type="password"
                placeholder="Password"
                name="password"
                required
                value={this.state.newUser.password}
                onChange={(e) => this.handleInputChange(e, 'newUser')}
              />
            </Col>
            <Col>
              <Button variant="primary" type="submit">
                Add User
              </Button>
            </Col>
          </Row>
        </Form>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Username</th>
              <th>Password</th>
              <th>Change</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <React.Fragment key={user.id}>
                <tr>
                  <td>{user.username}</td>
                  <td>{user.password}</td>
                  <td>
                    {passwordInputs[user.id]?.isVisible ? (
                      <Form className='mb-3' onSubmit={(e) => this.handleUpdatePassword(e, user.username, user.id)}>
                        <Form.Control
                          className="mb-2"
                          type="password"
                          placeholder="New Password"
                          name="newPassword"
                          value={passwordInputs[user.id]?.newPassword}
                          onChange={(e) => this.handleInputChange(e, user.id)}
                          required
                        />
                        <Button
                          variant="success"
                          type="submit"
                        >
                          Update Password
                        </Button>
                      </Form>
                    ) : (
                      <Button variant="info" onClick={() => this.handleChangePassword(user.id)}>
                        Change Password
                      </Button>
                    )}
                  </td>
                  <td>
                    <Button variant={user.active ? "primary" : 'danger'} onClick={() => this.handleActiveUser(user.username, user.id, !user.active)}>
                      {user.active ? "Active" : 'Deactive'}
                    </Button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </div>
    );
  }
}

export default AdminPage;
