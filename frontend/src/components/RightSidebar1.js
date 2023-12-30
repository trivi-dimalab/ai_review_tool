
import React, { Component } from 'react';
import { Col, Form, ListGroup, Button, Card } from 'react-bootstrap';
import AppContext from '../AppContext';

const containerStyles = {
  height: '100vh',
  overflowY: 'auto',
};

class RightSidebar1 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      fileName: '',
      isFinding: false,
      showInformation: false,
      selected: this.props.referenceInfo['status'] ? this.props.referenceInfo['status'].includes('selected') : false,
      originalValues: this.props.referenceInfo['response_qlty_questions'] ? 
                      this.props.referenceInfo['response_qlty_questions'].map(pair => pair['response']) : [],
      temporaryValues: this.props.referenceInfo['response_qlty_questions'] ? 
                        this.props.referenceInfo['response_qlty_questions'].map(pair => pair['response']) : [],
      isEditing: this.props.referenceInfo['response_qlty_questions'] ?
                  this.props.referenceInfo['response_qlty_questions'].map(() => false) : [],
      loading: false,
      referenceId: (new URLSearchParams(window.location.search)).get('reference_id', ''),
    };
  }

  static contextType = AppContext;

  handlePreview = () => {
    // Fetch referenceInfo from your backend API
    const {referenceId} = this.state;
    const pdfUrl = `http://${process.env.REACT_APP_FLASK_IP}/public/static_reference/${referenceId}.pdf`;
    // Open a new window or tab to display the PDF
    window.open(pdfUrl, '_blank');
  }

  handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (selectedFile.size > maxSize) {
      this.context.handleShowNoti({
        level: 'error',
        message: 'File size exceeds the limit (2MB)'
      });
      // Handle error (e.g., display a message to the user)
      event.target.value = null;
      return;
    }

    this.setState({ file: selectedFile });
  };

  handleUploadFile = async () => {
    const { file, referenceId } = this.state;
    const pro_id = this.context.project['pro_id'];

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = `upload_pdf_file?pro_id=${pro_id}&ref_id=${referenceId}`;
      const method = 'POST';
      const headers = {};
      const body = formData;

      this.setState({loading: true});
      this.context.handleApiRequest(endpoint, method, headers, body, true)
      .then((responseData) => {
        if (responseData.originalName)
          this.setState({ fileName: responseData.originalName, loading: false });

        this.context.handleShowNoti({
          level: 'success',
          message: responseData.message
        });
        window.location.reload();
      })
      .catch((error) => {
        this.setState({loading: true});
      });
    }
  };

  componentDidUpdate(prevProps) { 
    // Check if the referenceInfo prop has changed
    if (prevProps.referenceInfo !== this.props.referenceInfo) {
      this.setState({
        selected: this.props.referenceInfo['status'] ? this.props.referenceInfo['status'].includes('selected') : false,
        originalValues: this.props.referenceInfo['response_qlty_questions'] ? 
                      this.props.referenceInfo['response_qlty_questions'].map(pair => pair['response']) : [],
        temporaryValues: this.props.referenceInfo['response_qlty_questions'] ? 
                          this.props.referenceInfo['response_qlty_questions'].map(pair => pair['response']) : [],
        isEditing: this.props.referenceInfo['response_qlty_questions'] ?
                    this.props.referenceInfo['response_qlty_questions'].map(() => false) : [],
      });
    }
  }
  
  handleChange = (index, updatedqltyResponse) => {
    this.setState((prevState) => {
      const updatedTemporaryValues = [...prevState.temporaryValues];
      updatedTemporaryValues[index] = updatedqltyResponse; // Set the temporary value
      return { temporaryValues: updatedTemporaryValues };
    });
  }

  handleNotEdit = (index) => {
    this.setState((prevState) => {
      const updatedIsEditing = [...prevState.isEditing];
      updatedIsEditing[index] = false; // Set as not editing
      const updatedTemporaryValues = [...prevState.temporaryValues];
      updatedTemporaryValues[index] = prevState.originalValues[index]; // Restore original value
      return {
        isEditing: updatedIsEditing,
        temporaryValues: updatedTemporaryValues,
      };
    });
  }

  handleSave = async (index) => {
    const modalInfo = {
      level: 'update',
      message: `Do you want to edit this response?`,
      onYes: () => this.handleUpload(index)
    };
    this.context.handleShowModal(modalInfo);
  }

  handleUpload = (index) => {
    const { temporaryValues, isEditing, referenceId } = this.state;
  
    // Check if the response has changed
    if (isEditing[index]) {
      const updatedResponse = temporaryValues[index]; // Get the updated response
      const question_id = this.props.referenceInfo['response_qlty_questions'][index]['question_id'];
      const pro_id = this.context.project['pro_id'];
  
      const endpoint = `update_qlty_response`;
      const method = 'POST';
      const headers = {
        'Content-Type': 'application/json'
      };
      const body = {
        'pro_id': pro_id, 
        'ref_id': referenceId,
        'question_id': question_id,
        'new_response': updatedResponse
      };

      this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState((prevState) => {
          const updatedIsEditing = [...prevState.isEditing];
          updatedIsEditing[index] = false; // Set as not editing
          const updatedOriginalValues = [...prevState.originalValues];
          updatedOriginalValues[index] = updatedResponse;
          return {
            isEditing: updatedIsEditing,
            originalValues: updatedOriginalValues,
          };
        });

        this.context.handleShowNoti({
          level: 'success',
          message: responseData.message
        });
      })
      .catch((error) => {});
    }
  }
  

  handleToggleEdit = (index) => {
    this.setState((prevState) => {
      const updatedIsEditing = [...prevState.isEditing];
      updatedIsEditing[index] = !updatedIsEditing[index]; // Toggle between edit and not edit
      return { isEditing: updatedIsEditing };
    });
  }

  autoAnswer = async (question) => {
    let message = `Let answer this question: ${question}`;
    this.setState({ loading: true });
    
    // Add user's message to the chat first
    this.props.onMessageSent({ content: message, role: 'user' });

    const pro_id = this.context.project['pro_id'];
    const endpoint = 'send_message_step_2';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };

    const body = {
      'pro_id': pro_id,
      'ref_id': this.state.referenceId,
      'question_type': '0',
      'message': message
    }

    const response = await this.context.handleApiRequest(endpoint, method, headers, body);
    // Handle the response from Flask and update your chat

    if (response.success) {
      this.props.onMessageSent({ content: response.data.message, role: 'assistant' });
    }

    this.setState({ loading: false });
  }

  saveTag = (status) => {
    const modalInfo = {
      level: 'update',
      message: `Do you want to update status of this reference?`,
      onYes: () => this.handleUpdateStatus(status)
    };
    this.context.handleShowModal(modalInfo);
  }

  handleUpdateStatus = (status) => {
    const newStatus = status ? 'selected' : 'unselected';
    const pro_id = this.context.project['pro_id'];
    const {referenceId} = this.state;
    const endpoint = `update_reference`;
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json'
    };
  
    const body = {
      'pro_id': pro_id,
      'referenceId': referenceId, 
      'update_type': 'update_status',
      'new_status': newStatus
    }

    this.context.handleApiRequest(endpoint, method, headers, body)
    .then((data) => {
      this.setState({selected: status});
      this.context.handleShowNoti({
        level: 'success',
        message: data.message
      });
    })
    .catch((error) => {
    });
  };

  toggleShowInformation = () => {
    this.setState((prevState) => ({
      showInformation: !prevState.showInformation,
    }));
  }

  render() {
    const {referenceInfo} = this.props;

    const {fileName, showInformation} = this.state;
    const {role, username} = this.context;
    const colorMap = {
      unscreen: 'primary',
      screened: 'success',
      selected: 'info',
    };

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
            <div className="sr-only ml-2">Finding...</div>
          </div>
        )}
        <div className="sidebar-container mb-3" style={containerStyles}>
          <div className="mt-2  text-center">
            <h4 style={{ fontWeight: 'bold' }}>Reference Info</h4>
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold', marginRight: '9px'  }}>Title:</label>
            {referenceInfo['title']}
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>Authors:</label>
            {referenceInfo['authors']}
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>Year:</label>
            {referenceInfo['year']}
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
          <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>Status:</label> {
              referenceInfo['status'] ? <>{referenceInfo['status'].map((ele, index) => 
              <Button
                key={index}
                variant={colorMap[ele]}
                style={{ marginRight: '5px', marginBottom: '5px' }}
              >
                {ele}
              </Button>)}</> : <></>
            }
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>Uploaded file:</label>
            {referenceInfo && referenceInfo.pdf ? `${referenceInfo.pdf.originalName} (${referenceInfo.pdf.created_by})` : 'Not yet'}
            <Card className="mt-3">
              <Card.Body>
                <div className="d-flex justify-content-center">
                  <input type="file" accept=".pdf" onChange={this.handleFileChange} />
                </div>
                {this.state.file ? 
                  <div className="d-flex justify-content-center mt-3">
                      <Button onClick={this.handleUploadFile}>Save new PDF</Button> 
                  </div> : <></>
                }
              </Card.Body>
            </Card>
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>Other information (Abstract, Keyword, etc.):</label>
            <Button
                variant="link"
                className='mb-2'
                onClick={this.toggleShowInformation}
                aria-controls="invalid-documents"
                aria-expanded={showInformation}
              >
                ({showInformation ? 'Hide' : 'Show'}) 
            </Button>
            {showInformation ? <div>
              <div className="mt-3"> {/* Center text and buttons */}
                <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>Abstract:</label>
                {referenceInfo['abstract']}
              </div>
              <div className="mt-3"> {/* Center text and buttons */}
                <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>Keywords:</label>
                {referenceInfo['keywords']}
              </div>
              <div className="mt-3 mb-3"> {/* Center text and buttons */}
                <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>Source:</label>
                {referenceInfo['source_title']}
              </div>
            </div> : <></>
          }
          </div>
          <div className="mt-3 mb-3"> {/* Center text and buttons */}
              <label className="mb-3" style={{ fontWeight: 'bold', marginRight: '7px'  }}>Quality Assessment Questions: </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end'}}>
            </div>
            {this.state.temporaryValues.map((value, index) => (
              <Card className='mt-2 mb-4'>
              <Card.Body>
              <div key={index} style={{ paddingLeft: '10px' }}>
                <label className="mb-3" style={{ fontWeight: 'bold', marginRight: '7px'  }}>
                  {`RQ${index + 1}: ${referenceInfo['response_qlty_questions'][index]['question']}`}
                </label>
                {this.state.isEditing[index] ? (
                  <>
                    <Form.Control
                      type="text"
                      value={value}
                      onChange={(e) => this.handleChange(index, e.target.value)}
                    />
                    <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                      <Button
                        variant="success"
                        size="sm"
                        style={{ marginRight: '3px' }}
                        onClick={() => this.handleSave(index)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => this.handleNotEdit(index)}
                      >
                        Not Edit
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-2">Answer: {value ? `${value} (${this.props.referenceInfo['response_qlty_questions'][index]['responded_by'] || username})` : 'Not respond yet'}</div>
                    <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                      <Button
                        variant="info"
                        size="sm"
                        style={{ marginRight: '3px' }}
                        onClick={() => this.handleToggleEdit(index)}
                      >
                        Edit
                      </Button>
                    </div>
                    {referenceInfo.pdf ? 
                      <Button variant="primary" onClick={() => this.autoAnswer(referenceInfo['response_qlty_questions'][index]['question'])}>Auto-answer</Button>
                      : <></>
                    }
                  </>
                )}
              </div>
              </Card.Body>
              </Card>
            ))}
          </div>
          <div className="mt-3 mb-3 text-center">
          {
            (role === 'owner' || username === referenceInfo['created_by']) && (
              this.state.selected ?
                <Button variant="danger" onClick={() => this.saveTag(0)}>Unselect</Button> :
                <Button style={{ marginRight: '3px' }} onClick={() => this.saveTag(1)}>Select</Button>
            )
          }
          </div>
        </div>
      </Col>
    );
  }
}

export default RightSidebar1;
