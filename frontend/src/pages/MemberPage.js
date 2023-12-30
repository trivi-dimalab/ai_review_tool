import React, { Component } from 'react';
import { Table, Button, Form, Row, Col } from 'react-bootstrap';
import AppContext from '../AppContext';
import Select from 'react-select';

class MemberPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newUser: '',
      members: [],
      users: []
    };
  }

  static contextType = AppContext

  componentDidMount() {
    const endpoint = `get_members?pro_id=${this.context.project['pro_id']}`;
    const method = 'GET';
    const headers = {};
    const body = null;

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState({ members: responseData.members, 
            users: responseData.users.map(user => 
                {
                    return {
                        'label': user['username'], 
                        'value': user['username']
                    }
                }
            ) 
        });
      })
      .catch((error) => {});
  }

  handleAddNewMember = (e) => {
    e.preventDefault();

    const modalInfo = {
      level: 'update',
      message: 'Do you want to invite a new member?',
      onYes: () => this.addMemberRequest()
    };

    this.context.handleShowModal(modalInfo);
  }

  addMemberRequest = () => {
    const pro_id = this.context.project['pro_id'];
    const endpoint = 'add_member';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = {'pro_id': pro_id, 'new_username': this.state.newUser['value']};

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.context.handleShowNoti({
          level: 'success', 
          message: responseData.message,
          callback: () => {window.location.reload()}
        });
        
      })
      .catch((error) => {});
  };

  handleDeleteMember = (e, username) => {
    e.preventDefault();

    const modalInfo = {
      level: 'update',
      message: `Do you want to delete a member "${username}"?`,
      onYes: () => this.deleteMemberRequest(username)
    };

    this.context.handleShowModal(modalInfo);
  }

  deleteMemberRequest = (username) => {
    const pro_id = this.context.project['pro_id'];
    const endpoint = 'delete_member';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = {'pro_id': pro_id, 'username': username};

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.context.handleShowNoti({
          level: 'success', 
          message: responseData.message,
          callback: () => {window.location.reload()}
        });
      })
      .catch((error) => {});
  };

  render() {
    const { members, users } = this.state;

    return (
      <div>
        <h1>Member Page</h1>
        {this.context.project['pro_status'] == true && this.context.project['mem_role'] == 'owner' ?
            <Form className='mb-3' onSubmit={this.handleAddNewMember}>
            <Row>
              <Col>
                <Select
                  options={users}
                  value={this.state.newUser}
                  onChange={(value) => this.setState({newUser: value})}
                  isSearchable
                  placeholder="Select a user..."
                />
              </Col>
              <Col>
                <Button variant="primary" type="submit">
                  Invite Member
                </Button>
              </Col>
            </Row>
          </Form> : <></>
        }
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Member Role</th>
              <th>Member Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td style={{'fontWeight': member.mem_username == this.context.username ? '800' : '500'}}>
                    {member.mem_username} {member.mem_username == this.context.username ? '(me)' : ''}
                  </td>
                  <td>{member.mem_role}</td>
                  <td>{member.mem_status}</td>
                  <td>
                    {this.context.project['pro_status'] == true && this.context.project['mem_role'] == 'owner' && member.mem_username != this.context.username ?
                      <Button variant='danger' onClick={(e) => this.handleDeleteMember(e, member.mem_username)}>
                        Delete
                      </Button> :
                      <></>
                    }
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

export default MemberPage;
