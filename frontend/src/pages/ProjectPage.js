import React, { Component } from 'react';
import { Table, Button, Form, Row, Col } from 'react-bootstrap';
import AppContext from '../AppContext';

class ProjectPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      newProject: '',
    };
  }

  static contextType = AppContext

  componentDidMount() {
    const endpoint = 'get_projects';
    const method = 'GET';
    const headers = {};
    const body = null;

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState({ projects: responseData.projects });
        this.context.handleUpdateProjects(responseData.projects);
      })
      .catch((error) => {});
  }

  handleActiveProject = (pro_name, pro_id, status) => {
    const modalInfo = {
      level: 'update',
      message: `Do you want to ${status ? 'active' : 'deactive'} "${pro_name}" project?`,
      onYes: () => this.updateStatusRequest(pro_id, status)
    };
    this.context.handleShowModal(modalInfo);

  }

  updateStatusRequest = (pro_id, status) => {
    const endpoint = 'change_status_project';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = {
      pro_id: pro_id,
      new_status: status,
    };

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState({projects: responseData.projects});
        this.context.handleShowNoti({
          level: 'success',
          message: responseData.message
        });
        this.context.handleUpdateProjects(responseData.projects)
      })
      .catch((error) => {});
  };

  handleAddProject = (e) => {
    e.preventDefault();

    const modalInfo = {
      level: 'update',
      message: 'Do you want to add a new project?',
      onYes: () => this.addProjectRequest()
    };

    this.context.handleShowModal(modalInfo);
  }

  addProjectRequest = () => {
    const endpoint = 'add_project';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = {'pro_name': this.state.newProject};

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState({projects: responseData.projects});
        this.context.handleShowNoti({
          level: 'success', 
          message: responseData.message
        });
        this.context.handleUpdateProjects(responseData.projects);
      })
      .catch((error) => {});
  };

  handleChangeMemStatus = (pro_name, pro_id, status) => {
    const modalInfo = {
      level: 'update',
      message: `Do you want to ${status} the project "${pro_name}"?`,
      onYes: () => this.changeMemStatusRequest(pro_id, status)
    };

    this.context.handleShowModal(modalInfo);
  }

  changeMemStatusRequest = (pro_id, status) => {
    const endpoint = 'change_status_member';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = {'pro_id': pro_id, 'status': status};

    this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState({project: responseData.projects});
        this.context.handleShowNoti({
          level: 'success', 
          message: responseData.message,
          callback: () => window.location.reload(),
        });
      })
      .catch((error) => {});
  };

  handleHeaderClick = (project) => {
    this.context.handleUpdateProject(project);
    window.location.href = `/project_info`;
  }

  render() {
    const { projects } = this.state;

    return (
      <div>
        <h1>Project Page</h1>
        <Form className='mb-3' onSubmit={this.handleAddProject}>
          <Row>
            <Col>
              <Form.Control
                type="text"
                placeholder="Project name"
                name="pro_name"
                required
                value={this.state.newProject}
                onChange={(e) => this.setState({newProject: e.target.value})}
              />
            </Col>
            <Col>
              <Button variant="primary" type="submit">
                Add Project
              </Button>
            </Col>
          </Row>
        </Form>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Project Status</th>
              <th>Project Owner</th>
              {/* <th>Created At</th> */}
              <th>Member Role</th>
              <th>Added by</th>
              <th>Member Status</th>
              <th>Updated status by</th>
              {/* <th>Updated status at</th> */}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <React.Fragment key={project.id}>
                <tr>
                  <td style={{ textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={() => this.handleHeaderClick(project)}
                  >
                    {project.pro_name}
                  </td>
                  <td>
                    {project.mem_role === 'owner' ? (
                      <Button
                        variant={project.pro_status ? 'primary' : 'danger'}
                        onClick={() => this.handleActiveProject(project.pro_name, project.pro_id, !project.pro_status)}
                      >
                        {project.pro_status ? 'Active' : 'Deactive'}
                      </Button>
                    ) : (
                      project.pro_status ? 'Active' : 'Deactive'
                    )}
                  </td>
                  <td>{project.pro_owner}</td>
                  {/* <td>{project.pro_created_at}</td> */}
                  <td>{project.mem_role}</td>
                  <td>{project.mem_added_by}</td>
                  <td>{project.mem_status}</td>
                  <td>{project.mem_updated_by}</td>
                  {/* <td>{project.mem_updated_at}</td> */}
                  <td>
                    {
                      project.mem_role != 'owner' ? <>{
                        project.mem_status == 'waiting' ?
                        <>
                          <Button style={{marginRight: '2px'}} variant='success' onClick={() => this.handleChangeMemStatus(project.pro_name, project.pro_id, 'active')}>
                            Accept
                          </Button>
                          <Button variant='danger' onClick={() => this.handleChangeMemStatus(project.pro_name, project.pro_id, 'reject')}>
                            Reject
                          </Button>
                        </> : <Button variant='danger' onClick={() => this.handleChangeMemStatus(project.pro_name, project.pro_id, 'quit')}>
                            Quit
                          </Button>}</> :
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

export default ProjectPage;
