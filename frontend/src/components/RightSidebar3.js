
import React, { Component } from 'react';
import { Col, Form, ListGroup, Button, Card, Dropdown } from 'react-bootstrap';
import AppContext from '../AppContext';

const containerStyles = {
  height: '100vh',
  overflowY: 'auto',
};

class RightSidebar3 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
  }

  static contextType = AppContext;

  componentDidMount() {
  }

  onExport = (question_id='', sub_question_id='') => {
    const pro_id = this.context.project['pro_id'];
    const endpoint = `export_excel`;
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json'
    };
    const body = {
      'pro_id': pro_id, 
      'question_id': question_id, 
      'sub_question_id': sub_question_id
    };

    this.context.handleApiRequest(endpoint, method, headers, body, false, false)
    .then((responseData) => {
        return responseData.blob();
    })
    .then((blob) => {
      // Create a Blob URL for the file content
      const blobUrl = URL.createObjectURL(blob);

      // Create an anchor element to trigger the download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'exported_file.xlsx';  // You can customize the filename

      // Append the anchor element to the document and trigger the download
      document.body.appendChild(a);
      a.click();

      // Remove the anchor element from the document
      document.body.removeChild(a);
    })
    .catch((error) => {});
  }

  onWrite = async (question_id='', sub_question_id='') => {
    let message = ''

    if (sub_question_id) {
      message = `I want to write a summary for the sub research question ${question_id}.${sub_question_id}`;
    } else {
      if (question_id) {
        message = `I want to write a summary for all sub research questions in research question ${question_id}`;
      } else {
        message = `I want to write a summary for all sub research questions `;
      }
    }

    this.setState({ loading: true });
    
    // Add user's message to the chat first
    this.props.onMessageSent({ content: message, role: 'user' });

    const pro_id = this.context.project['pro_id'];
    const endpoint = 'write_text';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };

    const body = {
      'pro_id': pro_id,
      'ref_id': this.props.ref_id || '',
      'question_type': this.props.question_type || '0',
      'message': message
    }

    const response = await this.context.handleApiRequest(endpoint, method, headers, body);
    // Handle the response from Flask and update your chat

    if (response.success) {
      this.props.onMessageSent({ content: response.data.message, role: 'assistant' });
    }

    this.setState({ loading: false });
  }

  render() {
    const {questions=[], subQuestions=[]} = this.props.referenceInfo;

    return (
      <Col>
        {this.state.loading && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000, // Adjust the z-index as needed
            }}
          >
            <div className="spinner-border text-primary" role="status">
            </div>
            <div className="sr-only ml-2">Loading...</div>
          </div>
        )}
        <div className="sidebar-container mb-3" style={containerStyles}>
          <div className="mt-2  text-center">
            <h4 style={{ fontWeight: 'bold' }}>Document Synthesis</h4>
          </div>
          <div className="mt-3 mb-3"> {/* Center text and buttons */}
            <label className="mb-3" style={{ fontWeight: 'bold', marginRight: '7px'  }}>Research Questions: </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
              <Dropdown>
                <Dropdown.Toggle variant="info" style={{ marginRight: '3px' }}>
                  Task
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => this.onExport()}>Export all responses</Dropdown.Item>
                  <Dropdown.Item onClick={() => this.onWrite()}>Write a summary</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
              {questions.map((question, index) => (
                <Card className='mt-2 mb-4' key={index}>
                  <Card.Body>
                    <div style={{ paddingLeft: '10px' }} className='mb-2'>
                      <label className="mb-3" style={{ fontWeight: 'bold', marginRight: '7px' }}>
                        {`RQ${index + 1}: ${question['value']}`}
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
                        <Dropdown>
                          <Dropdown.Toggle variant="primary" style={{ marginRight: '3px' }}>
                            Task
                          </Dropdown.Toggle>

                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => this.onExport(question['_id'])}>Export all responses</Dropdown.Item>
                            <Dropdown.Item onClick={() => this.onWrite(index + 1)}>Write a summary</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                      {subQuestions.filter(item => item['question_id'] == question['_id']).map((sub_question, sub_index) => (
                        <Card key={sub_index} style={{padding: '5px', marginBottom: '5px'}}>
                          {`SRQ${sub_index + 1}: ${sub_question['value']}`}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
                            <Dropdown>
                              <Dropdown.Toggle variant="warning" style={{ marginRight: '3px' }}>
                                Task
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item onClick={() => this.onExport(question['_id'], sub_question['_id'])}>Export all responses</Dropdown.Item>
                                <Dropdown.Item onClick={() => this.onWrite(index + 1, sub_index + 1)}>Write a summary</Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              ))}
          </div>
        </div>
      </Col>
    );
  }
}

export default RightSidebar3;
