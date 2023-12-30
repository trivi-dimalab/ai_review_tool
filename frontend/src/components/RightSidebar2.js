
import React, { Component } from 'react';
import { Col, Form, ListGroup, Button, Card } from 'react-bootstrap';
import AppContext from '../AppContext';

const containerStyles = {
  height: '100vh',
  overflowY: 'auto',
};

class RightSidebar2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      fileName: '',
      showInformation: false,
      originalAnswers: this.props.referenceInfo['response_sub_questions'] ? 
      this.reformatObject(this.props.referenceInfo['response_sub_questions']) : {},
      temporaryAnswers: this.props.referenceInfo['response_sub_questions'] ? 
      this.reformatObject(this.props.referenceInfo['response_sub_questions']) : {},
      isEditing: this.props.referenceInfo['response_sub_questions'] ? 
      this.generateEditing(this.props.referenceInfo['response_sub_questions']) : {},
      editor: this.props.referenceInfo['response_sub_questions'] ? 
      this.generateEditor(this.props.referenceInfo['response_sub_questions']) : {},
      loading: false,
      referenceId: (new URLSearchParams(window.location.search)).get('reference_id', ''),
    };
  }

  static contextType = AppContext;

  generateEditing = (questions) => {
    let response_sub_questions = {}

    for (let key in questions) {
      response_sub_questions[key] = {};

      const sub_questions = questions[key]['sub_questions'];
      
      for (let subKey in sub_questions) {
        response_sub_questions[key][subKey] = false;
      }
    }

    return response_sub_questions
  }

  generateEditor = (questions) => {
    let response_sub_questions = {}

    for (let key in questions) {
      response_sub_questions[key] = {};

      const sub_questions = questions[key]['sub_questions'];
      
      for (let subKey in sub_questions) {
        response_sub_questions[key][subKey] = sub_questions[subKey]['responded_by'];
      }
    }

    return response_sub_questions
  }

  generateFinding = (questions) => {
    let response_sub_questions = {}

    for (let key in questions) {
      response_sub_questions[key] = false;
    }

    return response_sub_questions
  }

  reformatObject = (questions) => {
    let response_sub_questions = {}

    for (let key in questions) {
      response_sub_questions[key] = {};

      const sub_questions = questions[key]['sub_questions'];
      
      for (let subKey in sub_questions) {
        response_sub_questions[key][subKey] = sub_questions[subKey]['response'];
      }
    }

    return response_sub_questions
  } 

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
        originalAnswers: this.props.referenceInfo['response_sub_questions'] ? 
        this.reformatObject(this.props.referenceInfo['response_sub_questions']) : {},
        temporaryAnswers: this.props.referenceInfo['response_sub_questions'] ? 
        this.reformatObject(this.props.referenceInfo['response_sub_questions']) : {},
        isEditing: this.props.referenceInfo['response_sub_questions'] ? 
        this.generateEditing(this.props.referenceInfo['response_sub_questions']) : {},
        editor: this.props.referenceInfo['response_sub_questions'] ? 
        this.generateEditor(this.props.referenceInfo['response_sub_questions']) : {},
      });
    }
  }
  
  handleChange = (key, sub_key, new_value) => {
    this.setState((prevState) => {
      const updatedTemporaryAnswers = { ...prevState.temporaryAnswers };
      updatedTemporaryAnswers[key] = { ...updatedTemporaryAnswers[key] };
      updatedTemporaryAnswers[key][sub_key] = new_value;
      return { temporaryAnswers: updatedTemporaryAnswers };
    });
  }

  handleNotEdit = (key, sub_key) => {
    this.setState((prevState) => {
      const updatedIsEditing = { ...prevState.isEditing };
      updatedIsEditing[key] = { ...updatedIsEditing[key] }; // Deep clone the nested object
      updatedIsEditing[key][sub_key] = !updatedIsEditing[key][sub_key]; // Toggle between edit and not edit

      const updatedTemporaryAnswers = { ...prevState.temporaryAnswers };
      updatedTemporaryAnswers[key] = { ...updatedTemporaryAnswers[key] };
      updatedTemporaryAnswers[key][sub_key] = prevState.originalAnswers[key][sub_key];
      return { isEditing: updatedIsEditing, temporaryAnswers: updatedTemporaryAnswers };
    });
  }

  handleSave = async (key, sub_key) => {

    const modalInfo = {
      level: 'update',
      message: `Do you want to edit this response?`,
      onYes: () => this.handleUpload(key, sub_key)
    };
    this.context.handleShowModal(modalInfo);
  }

  handleUpload = (key, sub_key) => {
    const { temporaryAnswers, isEditing, referenceId } = this.state;
  
    // Check if the response has changed
    if (isEditing[key][sub_key]) {
      const updatedResponse = temporaryAnswers[key][sub_key];

      const question_id = sub_key;
      const pro_id = this.context.project['pro_id'];
  
      const endpoint = `update_sub_response`;
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
          const updatedIsEditing = { ...prevState.isEditing };
          updatedIsEditing[key] = { ...updatedIsEditing[key] }; // Deep clone the nested object
          updatedIsEditing[key][sub_key] = !updatedIsEditing[key][sub_key]; // Toggle between edit and not edit

          const updatedOriginalAnswers = { ...prevState.originalAnswers };
          updatedOriginalAnswers[key] = { ...updatedOriginalAnswers[key] };
          updatedOriginalAnswers[key][sub_key] = updatedResponse;

          const updatedEditor = { ...prevState.editor };
          updatedEditor[key] = { ...updatedEditor[key] };
          updatedEditor[key][sub_key] = this.context.username;

          return { isEditing: updatedIsEditing, originalAnswers: updatedOriginalAnswers, editor: updatedEditor };
        });

        this.context.handleShowNoti({
          level: 'success',
          message: responseData.message
        });
      })
      .catch((error) => {});
    }
  }
  

  handleToggleEdit = (key, sub_key) => {
    this.setState((prevState) => {
      const updatedIsEditing = { ...prevState.isEditing };
      updatedIsEditing[key] = { ...updatedIsEditing[key] }; // Deep clone the nested object
      updatedIsEditing[key][sub_key] = !updatedIsEditing[key][sub_key]; // Toggle between edit and not edit
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
      'question_type': '1',
      'message': message
    }

    const response = await this.context.handleApiRequest(endpoint, method, headers, body);
    // Handle the response from Flask and update your chat

    if (response.success) {
      this.props.onMessageSent({ content: response.data.message, role: 'assistant' });
    }

    this.setState({ loading: false });
  }


  toggleShowInformation = () => {
    this.setState((prevState) => ({
      showInformation: !prevState.showInformation,
    }));
  }

  render() {
    const {referenceInfo} = this.props;

    const {showInformation, originalAnswers, temporaryAnswers, isEditing, editor} = this.state;
    const questions = this.props.referenceInfo['response_sub_questions'];
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
            <label className="mb-3" style={{ fontWeight: 'bold', marginRight: '7px'  }}>Research Questions: </label>
            {
              Object.keys(temporaryAnswers).length ? (
                <>
                  {Object.keys(temporaryAnswers).map((key, index) => (
                    <Card className='mt-2 mb-4' key={index}>
                      <Card.Body>
                        <div style={{ paddingLeft: '10px' }} className='mb-2'>
                          <label className="mb-3" style={{ fontWeight: 'bold', marginRight: '7px' }}>
                            {`RQ${index + 1}: ${questions[key]['value']}`}
                          </label>
                          {temporaryAnswers[key] ? (
                            <>
                              {Object.keys(temporaryAnswers[key]).map((sub_key, sub_index) => (
                                <Card key={sub_index} style={{padding: '5px', marginBottom: '5px'}}>
                                  {`SRQ${sub_index + 1}: ${questions[key]['sub_questions'][sub_key]['value']}`}
                                  {
                                    isEditing[key][sub_key] ? (
                                      <>
                                        <Form.Control
                                          type="text"
                                          value={temporaryAnswers[key][sub_key]}
                                          onChange={(e) => this.handleChange(key, sub_key, e.target.value)}
                                        />
                                        <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                                          <Button
                                            variant="success"
                                            size="sm"
                                            style={{ marginRight: '3px' }}
                                            onClick={() => this.handleSave(key, sub_key)}
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => this.handleNotEdit(key, sub_key)}
                                          >
                                            Not Edit
                                          </Button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="mt-2">Answer: {originalAnswers[key][sub_key] ?  `${originalAnswers[key][sub_key]} (${editor[key][sub_key]})` : 'Not respond yet'}</div>
                                        <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                                          <Button
                                            variant="info"
                                            size="sm"
                                            style={{ marginRight: '3px' }}
                                            onClick={() => this.handleToggleEdit(key, sub_key)}
                                          >
                                            Edit
                                          </Button>
                                          <Button variant="primary" className='mb-2' onClick={() => this.autoAnswer(questions[key]['sub_questions'][sub_key]['value'])}>Auto-answer</Button>
                                        </div>
                                      </>
                                    )
                                  }
                                </Card>
                              ))}
                            </>
                          ) : <></>}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </>
              ) : <></>
            }
          </div>
        </div>
      </Col>
    );
  }
}

export default RightSidebar2;
