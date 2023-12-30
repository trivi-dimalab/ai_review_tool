import React, { Component } from 'react';
import { Container, Row, Col, Table, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import AppContext from '../AppContext';

class ReferencePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
        csvData: [],
        file: null,
        title: '',
        year: '',
        author: '',
        created_by: '',
        created_at: '',
        status: 'all',
        owner: 'all',
      };
  }

  static contextType = AppContext;

  componentDidMount() {
    const endpoint = `get_references?pro_id=${this.context.project['pro_id']}`;
    const method = 'GET';
    const headers = {};
    const body = null;

    this.context.handleApiRequest(endpoint, method, headers, body)
    .then((responseData) => {
      this.setState({ 
          csvData: responseData['references'],
      });
    })
    .catch((error) => {});
  }

  removeFile = (referenceId) => {
    const modalInfo = {
      level: 'update',
      message: `Do you want to remove this reference?`,
      onYes: () => this.handleUpload(referenceId)
    };
    this.context.handleShowModal(modalInfo);
  }

  handleUpload = (referenceId) => {
    const pro_id = this.context.project['pro_id'];

    const endpoint = `update_reference`;
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json'
    };
    const body = { 'pro_id': pro_id, 'referenceId': referenceId, 'update_type': 'remove'};

    this.context.handleApiRequest(endpoint, method, headers, body)
    .then((responseData) => {
      this.setState((prevState) => ({
        csvData: prevState.csvData.filter(item => item._id !== referenceId)
      }));

      this.context.handleShowNoti({
        level: 'success',
        message: responseData.message
      });
    })
    .catch((error) => {});
  };

  handleButtonClick = (id) => {
    // Use history.push to navigate to the desired URL
    window.location.href = `/reference?reference_id=${id}`;
  };


  // Function to update research info in the state
  render() {
    const {project, username} = this.context;
    const isOwner = project.mem_role == 'owner' ? true : false;
    const { file, csvData, title, year, status, author, created_by, created_at, owner } = this.state;
    const owners = [...new Set(csvData.map(item => item.created_by))];
    let filterData = csvData;

    if (status != 'all')
      filterData = filterData.filter(item => item['status'].includes(status))

    if (owner != 'all')
      filterData = filterData.filter(item => item['created_by'].includes(owner))

    if (title != '') {
      if (title === 'asc') {
        filterData = filterData.sort((a, b) => a['title'].localeCompare(b['title']));
      } else {
        filterData = filterData.sort((a, b) => b['title'].localeCompare(a['title']));
      }
    }

    else if (author != '') {
      if (author === 'asc') {
        filterData = filterData.sort((a, b) => a['authors'].localeCompare(b['authors']));
      } else {
        filterData = filterData.sort((a, b) => b['authors'].localeCompare(a['authors']));
      }
    }

    else if (created_by != '') {
      if (created_by === 'asc') {
        filterData = filterData.sort((a, b) => a['created_by'].localeCompare(b['created_by']));
      } else {
        filterData = filterData.sort((a, b) => b['created_by'].localeCompare(a['created_by']));
      }
    }

    else if (created_at != '') {
      if (created_at === 'asc') {
        filterData = filterData.sort((a, b) => a['created_at'].localeCompare(b['created_at']));
      } else {
        filterData = filterData.sort((a, b) => b['created_at'].localeCompare(a['created_at']));
      }
    }

    else if (year != '') {
      if (year === 'asc') {
        filterData = filterData.sort((a, b) => a['year'] - b['year']);
      } else {
        filterData = filterData.sort((a, b) => b['year'] - a['year']);
      }
    }
      
    const colorMap = {
      unscreen: 'primary',
      screened: 'success',
      selected: 'info',
      invalid_1: 'warning',
      invalid_2: 'danger',
    };

    return (
      <Container fluid>
        <Row>
          <Col sm={12}>
            <div>
                <div className="mt-2 mb-2" style={{width:'100%'}}>
                  <Link to={`/find-references`} style={{marginRight: '10px'}}>
                    <Button variant="primary">Find references</Button>
                  </Link>  
                  <Link to={`/reference`} style={{marginRight: '10px'}}>
                    <Button variant="info">New a reference</Button>
                  </Link>  
                  <Link to={`/upload-references`}>
                    <Button variant="warning">Upload references (CSV)</Button>
                  </Link>   
                </div>
                <div className="mt-2 mb-2" style={{width:'100%'}}>
                  <Row>
                    <Col sm={2}>
                      <Form.Group>
                          <Form.Select
                            value={this.state.title}
                            onChange={(e) => this.setState({
                              'title': e.target.value,
                              'year': '',
                              'author': '',
                              'created_by': '',
                              'created_at': ''
                            })}
                          >
                          <option value="">--Sort title--</option>
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                          </Form.Select>
                      </Form.Group>
                    </Col>
                    {/* <Col sm={2}>
                      <Form.Group>
                          <Form.Select
                            value={this.state.author}
                            onChange={(e) => this.setState({
                              'author': e.target.value,
                              'year': '',
                              'title': '',
                              'created_by': '',
                              'created_at': ''
                            })}
                          >
                          <option value="">-- Sort author--</option>
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                          </Form.Select>
                      </Form.Group>
                    </Col> */}
                    <Col sm={2}>
                      <Form.Group>
                          <Form.Select
                            value={this.state.year}
                            onChange={(e) => this.setState({
                              'year': e.target.value,
                              'title': '',
                              'author': '',
                              'created_by': '',
                              'created_at': ''
                            })}
                          >
                          <option value="">--Sort year--</option>
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                          </Form.Select>
                      </Form.Group>
                    </Col>
                    {/* <Col sm={2}>
                      <Form.Group>
                          <Form.Select
                            value={this.state.created_by}
                            onChange={(e) => this.setState({
                              'created_by': e.target.value,
                              'year': '',
                              'author': '',
                              'title': '',
                              'created_at': ''
                            })}
                          >
                          <option value="">-- Sort owner's name--</option>
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                          </Form.Select>
                      </Form.Group>
                    </Col> */}
                    <Col sm={2}>
                      <Form.Group>
                          <Form.Select
                            value={this.state.created_at}
                            onChange={(e) => this.setState({
                              'created_at': e.target.value,
                              'author': '',
                              'title': '',
                              'year': '',
                              'created_by': ''
                            })}
                          >
                          <option value="">--Sort uploaded date--</option>
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                          </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={2}>
                      <Form.Group>
                          <Form.Select
                            value={this.state.status}
                            onChange={(e) => this.setState({'status': e.target.value})}
                          >
                          <option value="all">--All status--</option>
                          <option value="unscreen">Unscreen</option>
                          <option value="screened">Screened</option>
                          <option value="selected">Selected</option>
                          </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={2}>
                      <Form.Group>
                          <Form.Select
                            value={this.state.owner}
                            onChange={(e) => this.setState({'owner': e.target.value})}
                          >
                          <option value="all">--All owners--</option>
                          {
                            owners.map((ele, index) => {
                            return <option key={index} value={ele}>{ele}</option>})
                          }
                          </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={2}>
                      Total references:  {filterData.length}
                    </Col>
                  </Row>
                </div>
                {filterData && (
                <>
                    <Table striped bordered hover>
                    <thead>
                        <tr>
                        <th style={{width: '2%'}}>ID</th>
                        <th style={{width: '25%'}}>Title</th>
                        <th style={{width: '15%'}}>Authors</th>
                        <th style={{width: '10%'}}>Published year</th>
                        <th style={{width: '10%'}}>Created by</th>
                        <th style={{width: '10%'}}>Created at</th>
                        {/* <th style={{width: '5%'}}>Updated by</th>
                        <th style={{width: '10%'}}>Updated at</th> */}
                        {/* <th>Source title</th> */}
                        <th style={{width: '15%', textAlign: 'center'}}>Status</th>
                        <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filterData.map((item, index) => (
                        <tr key={item['_id']}>
                            <td>{index+1}</td>
                            <td>{item['title']}</td>
                            <td>{item['authors']}</td>
                            <td>{item['year']}</td>
                            <td>{item['created_by']}</td>
                            <td>{item['created_at']}</td>
                            {/* <td>{item['updated_by']}</td>
                            <td>{item['updated_at']}</td> */}
                            {/* <td>{item['Source title']}</td> */}
                            <th>
                              {
                                item['status'].map((ele, index) => 
                                <Button
                                  key={index}
                                  variant={colorMap[ele]}
                                  style={{ marginRight: '5px', marginBottom: '5px' }}
                                >
                                  {ele}
                                </Button>)
                              }
                            </th>
                            {
                              isOwner || item['created_by'] == username ? 
                              <td style={{ textAlign: 'center', display: 'flex' }}>
                                <Button
                                  variant="warning"
                                  style={{ marginRight: '5px', marginBottom: '5px' }}
                                  onClick={() => this.handleButtonClick(item['_id'])}
                                >
                                  {/* Replace 'Edit' text with an edit icon */}
                                  <FontAwesomeIcon icon={faPencilAlt} />
                                </Button>
                                <Button
                                  variant="danger"
                                  onClick={() => this.removeFile(item['_id'])}
                                  style={{ marginRight: '5px', marginBottom: '5px' }}
                                >
                                  {/* Replace 'Delete' text with a delete icon */}
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              </td> : <td></td>
                            }
                        </tr>
                        ))}
                    </tbody>
                    </Table>
                </>
                )}
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default ReferencePage;
