
import React, { Component } from 'react';
import { Col, Form, ListGroup, Button, Card,Badge} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import AppContext from '../AppContext';

const containerStyles = {
  height: '100vh',
  overflowY: 'auto',
};

class RightSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      researchTopic: props.researchInfo.topic || '', // Default Research Topic
      editTopic: false, // Track if Research Topic is being edited
      tmpTopic: '', // Temporary topic while editing


      researchDescription: props.researchInfo.description || '', // Default Research Topic
      editDescription: false, // Track if Research Topic is being edited
      tmpDescription: '', // Temporary topic while editing

      researchTitle: props.researchInfo.title || '', // Default Research Topic
      editTitle: false, // Track if Research Topic is being edited
      tmpTitle: '', // Temporary topic while editing

      objectives: props.researchInfo.objectives || [],
      newObjective: '', // New objective input
      editObjectives: [], // Track whether each objective is being edited
      originalObjectives: props.researchInfo.objectives || [],// Store a copy of original objectives

      questions: props.researchInfo.questions || [],
      newQuestion: '', // New objective input
      editQuestions: [], // Track whether each objective is being edited
      originalQuestions: props.researchInfo.questions || [],// Store a copy of original objectives
      
      keywords: props.researchInfo.keywords || [],
      newKeyword: '', // New objective input
      editKeywords: [], // Track whether each objective is being edited
      originalKeywords: props.researchInfo.keywords || [],// Store a copy of original objectives
      
      qltyQuestions: props.researchInfo.qltyQuestions || [],
      newQltyQuestion: '', // New objective input
      editQltyQuestions: [], // Track whether each objective is being edited
      originalQltyQuestions: props.researchInfo.qltyQuestions || [],// Store a copy of original objectives

      tmpQuestionGroup: '',
      subQuestions: props.researchInfo.subQuestions || [],
      newSubQuestion: '', // New objective input
      editSubQuestions: [], // Track whether each objective is being edited
      originalSubQuestions: props.researchInfo.subQuestions || [],// Store a copy of original objectives
    };
  }

  static contextType = AppContext;
  
  componentDidUpdate(prevProps) {
    const { researchInfo } = this.props;

    // Check if the researchInfo prop has changed
    if (prevProps.researchInfo !== researchInfo) {
      const {
        topic = '',
        description = '',
        title = '',
        objectives = [],
        questions = [],
        keywords = [],
        qltyQuestions = [],
        subQuestions = [],
      } = researchInfo;

      this.setState({
        researchTopic: topic,
        researchDescription: description,
        researchTitle: title,
        objectives,
        keywords,
        questions,
        subQuestions,
        qltyQuestions,
        originalObjectives: objectives,
        originalKeywords: keywords,
        originalQuestions: questions,
        originalQltyQuestions: qltyQuestions,
        originalSubQuestions: subQuestions,
      });
    }
  }
  
  toggleEdit = (field, index=0, isEdit=true) => {
    if (field == 'topic') {
      this.setState((prevState) => ({
        editTopic: !prevState.editTopic,
        tmpTopic: prevState.researchTopic, // Set temporary topic to the current topic
      }));
    }
    else if (field == 'description') {
      this.setState((prevState) => ({
        editDescription: !prevState.editDescription,
        tmpDescription: prevState.researchDescription, // Set temporary topic to the current topic
      }));
    }
    else if (field == 'title') {
      this.setState((prevState) => ({
        editTitle: !prevState.editTitle,
        tmpTitle: prevState.researchTitle, // Set temporary topic to the current topic
      }));
    } 
    else if (field == 'objective') {
      if (isEdit) {
        this.setState((prevState) => {
          let updatedEditObjectives = [...prevState.editObjectives];
          updatedEditObjectives[index] = !updatedEditObjectives[index];
          return { editObjectives: updatedEditObjectives };
        });
      } else {
        this.setState((prevState) => {
          let updatedObjectives = [...prevState.objectives];
          updatedObjectives[index] = {...prevState.originalObjectives[index]}; // Restore the original objective
          
          let updatedEditObjectives = [...prevState.editObjectives];
          updatedEditObjectives[index] = false; // Change back to "Edit" mode
          return { objectives: updatedObjectives, editObjectives: updatedEditObjectives };
        });
      }
    } 
    else if (field === 'question') {
      if (isEdit) {
        this.setState((prevState) => {
          let updatedEditQuestions = [...prevState.editQuestions];
          updatedEditQuestions[index] = !updatedEditQuestions[index];
          return { editQuestions: updatedEditQuestions };
        });
      } else {
        this.setState((prevState) => {
          let updatedQuestions = [...prevState.questions];
          updatedQuestions[index] = { ...prevState.originalQuestions[index] }; // Restore the original question
    
          let updatedEditQuestions = [...prevState.editQuestions];
          updatedEditQuestions[index] = false; // Change back to "Edit" mode
          return { questions: updatedQuestions, editQuestions: updatedEditQuestions };
        });
      }
    }
    else if (field === 'keyword') {
      if (isEdit) {
        this.setState((prevState) => {
          let updatedEditKeywords = [...prevState.editKeywords];
          updatedEditKeywords[index] = !updatedEditKeywords[index];
          return { editKeywords: updatedEditKeywords };
        });
      } else {
        this.setState((prevState) => {
          let updatedKeywords = [...prevState.keywords];
          updatedKeywords[index] = { ...prevState.originalKeywords[index] }; // Restore the original keyword
    
          let updatedEditKeywords = [...prevState.editKeywords];
          updatedEditKeywords[index] = false; // Change back to "Edit" mode
          return { keywords: updatedKeywords, editKeywords: updatedEditKeywords };
        });
      }
    }

    else if (field === 'qltyQuestion') {
      if (isEdit) {
        this.setState((prevState) => {
          let updatedEditQltyQuestions = [...prevState.editQltyQuestions];
          updatedEditQltyQuestions[index] = !updatedEditQltyQuestions[index];
          return { editQltyQuestions: updatedEditQltyQuestions };
        });
      } else {
        this.setState((prevState) => {
          let updatedQltyQuestions = [...prevState.qltyQuestions];
          updatedQltyQuestions[index] = { ...prevState.originalQltyQuestions[index] }; // Restore the original qltyQuestion
    
          let updatedEditQltyQuestions = [...prevState.editQltyQuestions];
          updatedEditQltyQuestions[index] = false; // Change back to "Edit" mode
          return { qltyQuestions: updatedQltyQuestions, editQltyQuestions: updatedEditQltyQuestions };
        });
      }
    }

    else if (field === 'subQuestion') {
      if (isEdit) {
        this.setState((prevState) => {
          let updatedEditSubQuestions = [...prevState.editSubQuestions];
          updatedEditSubQuestions[index] = !updatedEditSubQuestions[index];
          return { editSubQuestions: updatedEditSubQuestions };
        });
      } else {
        this.setState((prevState) => {
          let updatedSubQuestions = [...prevState.subQuestions];
          updatedSubQuestions[index] = { ...prevState.originalSubQuestions[index] }; // Restore the original subQuestion
    
          let updatedEditSubQuestions = [...prevState.editSubQuestions];
          updatedEditSubQuestions[index] = false; // Change back to "Edit" mode
          return { subQuestions: updatedSubQuestions, editSubQuestions: updatedEditSubQuestions };
        });
      }
    }
  }
  
  handleTemporaryChange = (field, e, index='None') => {
    if (['topic', 'description', 'title', 'questionGroup'].includes(field)) {
      this.setState({ [`tmp${field.charAt(0).toUpperCase() + field.slice(1)}`]: e.target.value });
    } else {
      const newState = {};
      const stateArray = this.state[`${field}s`];
      const newField = `new${field.charAt(0).toUpperCase() + field.slice(1)}`;
    
      if (index !== 'None') {
        newState[field + 's'] = stateArray.map((item, i) => (i === index ? { ...item, value: e.target.value } : item));
      } else {
        newState[newField] = e.target.value;
      }
    
      this.setState(newState);
    }
  }
  
  saveResearchInfo = (field, changeType = 'add', index) => {
    const { 
      tmpTopic, tmpDescription, tmpTitle,
      tmpQuestionGroup, newKeyword, newObjective, newQltyQuestion,
      newSubQuestion, newQuestion, objectives,
      questions, subQuestions, qltyQuestions, keywords
     } = this.state;
    let newValue;
    let parentId = '';
  
    switch (field) {
      case 'topic':
        newValue = tmpTopic;
        break;
      case 'description':
        newValue = tmpDescription;
        break;
      case 'title':
        newValue = tmpTitle;
        break;
      case 'objective':
        if (changeType == 'add')
          newValue = newObjective;
        else
          newValue = objectives[index];
        break;
      case 'keyword':
        if (changeType == 'add')
          newValue = newKeyword;
        else
          newValue = keywords[index];
        break;
      case 'question':
        if (changeType == 'add') {
          newValue = newQuestion;
        }
        else
          newValue = questions[index];
        break;
      case 'subQuestion':
        if (changeType == 'add') {
          newValue = newSubQuestion;
          parentId = tmpQuestionGroup;
        }
        else
          newValue = subQuestions[index];
        break;
      case 'qltyQuestion':
        if (changeType == 'add')
          newValue = newQltyQuestion;
        else
          newValue = qltyQuestions[index];
        break;
      default:
        break;
    }

  
    const modalInfo = {
      level: 'update',
      message: `Do you want to ${changeType} this ${field}?`,
      onYes: async () => {
        await this.handleSaveConcept(field, changeType, newValue, parentId).then((data) => {
          if (data && data.success) {
            if (['topic', 'description', 'title'].includes(field)) {
              this.setState((prevState) => ({
                [`research${field.charAt(0).toUpperCase() + field.slice(1)}`]: prevState[`tmp${field.charAt(0).toUpperCase() + field.slice(1)}`],
                [`edit${field.charAt(0).toUpperCase() + field.slice(1)}`]: false,
              }));
            } else if (['objective', 'keyword', 'question', 'subQuestion', 'qltyQuestion'].includes(field)) {
              if (changeType === 'add') {
                this.setState((prevState) => ({
                  [`${field}s`]: [...prevState[`${field}s`], { '_id': data['_id'], 'created_by': this.context.username, 'value': newValue, 'question_id': field == 'subQuestion' ? this.state.tmpQuestionGroup : '' }],
                  [`new${field.charAt(0).toUpperCase() + field.slice(1)}`]: '',
                  [`edit${field.charAt(0).toUpperCase() + field.slice(1)}s`]: Array(prevState[`${field}s`].length + 1).fill(false),
                  [`original${field.charAt(0).toUpperCase() + field.slice(1)}s`]: [...prevState[`original${field.charAt(0).toUpperCase() + field.slice(1)}s`], { '_id': data['_id'], 'created_by': this.context.username, 'value': newValue, 'question_id': field == 'subQuestion' ? this.state.tmpQuestionGroup : ''  }],
                }));
              } else if (changeType === 'remove') {
                this.setState((prevState) => {
                  let updatedArray = [...prevState[`${field}s`]];
                  let updatedEditArray = Array.from(prevState[`edit${field.charAt(0).toUpperCase() + field.slice(1)}s`]);
                  let updatedOriginalArray = [...prevState[`original${field.charAt(0).toUpperCase() + field.slice(1)}s`]];
                  updatedArray.splice(index, 1);
                  updatedEditArray.splice(index, 1);
                  updatedOriginalArray.splice(index, 1);
                  return { [`${field}s`]: updatedArray, [`edit${field.charAt(0).toUpperCase() + field.slice(1)}s`]: updatedEditArray, [`original${field.charAt(0).toUpperCase() + field.slice(1)}s`]: updatedOriginalArray };
                });
              } else if (changeType === 'edit') {
                this.setState((prevState) => {
                  let updatedArray = [...prevState[`original${field.charAt(0).toUpperCase() + field.slice(1)}s`]];
                  updatedArray[index] = { ...prevState[`${field}s`][index] };
                  let updatedEditArray = Array.from(prevState[`edit${field.charAt(0).toUpperCase() + field.slice(1)}s`]);
                  updatedEditArray[index] = false;
                  return {
                    [`original${field.charAt(0).toUpperCase() + field.slice(1)}s`]: updatedArray,
                    [`edit${field.charAt(0).toUpperCase() + field.slice(1)}s`]: updatedEditArray,
                  };
                });
              }
            }
          }
  
          this.context.handleShowNoti({
            level: data.error ? 'error' : 'success',
            message: data.message,
            callback: () => { },
          });
        });
      },
    };
  
    this.context.handleShowModal(modalInfo);
  };
  
  handleSaveConcept = async (field, changeType, value, parent_id='') => {
    const pro_id = this.context.project['pro_id'];
    const endpoint = 'change_project_info';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json',
    };
    const body = { 
      'pro_id': pro_id,
      'field': field,
      'new_value': value,
      'change_type': changeType,
      'parent_id': parent_id
    }
    
    const response = await this.context.handleApiRequest(endpoint, method, headers, body);
    return response
  };

  render() {
    const {
      editTopic,
      tmpTopic,
      researchTopic,
      editDescription,
      tmpDescription,
      researchDescription,
      editTitle,
      tmpTitle,
      researchTitle,
      newObjective,
      editObjectives,
      originalObjectives,
      objectives,
      newQuestion,
      editQuestions,
      originalQuestions,
      questions,
      keywords,
      newKeyword,
      editKeywords,
      subQuestions,
      newSubQuestion,
      editSubQuestions,
      originalSubQuestions,
      qltyQuestions,
      newQltyQuestion,
      editQltyQuestions
    } = this.state;

    const {project, username} = this.context;
    const isOwner = project.mem_role == 'owner' ? true : false;
    
    return (
      <Col className='mb-5'>
        <div className="sidebar-container" style={containerStyles}>
          <div className="mt-2  text-center">
            <h4 style={{ fontWeight: 'bold' }}>General Information</h4>
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>1. Research Topic:</label>
            {editTopic && isOwner ? (
              <>
                <Form.Control
                  type="text"
                  value={tmpTopic}
                  onChange={(e) => this.handleTemporaryChange('topic', e)}
                />
                <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                  <Button
                    variant="success"
                    size="sm"
                    style={{marginRight: '3px'}}
                    onClick={() => this.saveResearchInfo('topic', 'edit')}
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => this.toggleEdit('topic')}
                  >
                    Not Edit
                  </Button>
                </div>
              </>
            ) : (
              <>
                {researchTopic}
                {
                  isOwner ? 
                  <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => this.toggleEdit('topic')}
                    >
                      Edit
                    </Button>
                  </div> : <></>
                }
              </>
            )}
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>2. Research Description:</label>
            {editDescription && isOwner ? (
              <>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={tmpDescription}
                  onChange={(e) => this.handleTemporaryChange('description', e)}
                />
                <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                  <Button
                    variant="success"
                    size="sm"
                    style={{marginRight: '3px'}}
                    onClick={() => this.saveResearchInfo('description', 'edit')}
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => this.toggleEdit('description')}
                  >
                    Not Edit
                  </Button>
                </div>
              </>
            ) : (
              <>
                {researchDescription}
                {
                  isOwner ? 
                  <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => this.toggleEdit('description')}
                    >
                      Edit
                    </Button>
                  </div> : <></>
                }
              </>
            )}
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold', marginRight: '7px'  }}>3. Research Title:</label>
            {editTitle && isOwner ? (
              <>
                <Form.Control
                  type="text"
                  value={tmpTitle}
                  onChange={(e) => this.handleTemporaryChange('title', e)}
                />
                <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                  <Button
                    variant="success"
                    size="sm"
                    style={{marginRight: '3px'}}
                    onClick={() => this.saveResearchInfo('title', 'edit')}
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => this.toggleEdit('title')}
                  >
                    Not Edit
                  </Button>
                </div>
              </>
            ) : (
              <>
                {researchTitle}
                {
                  isOwner ? 
                  <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => this.toggleEdit('title')}
                    >
                      Edit
                    </Button>
                  </div> : <></>
                }
              </>
            )}
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold' }}>4. Research Objectives:</label>
            <div className="d-flex align-items-center mt-2 mb-4" >
              <Form.Control
                type="text"
                placeholder="Add research objectives"
                value={newObjective}
                onChange={(e) => this.handleTemporaryChange('objective', e)}
                style={{marginRight: '7px'}}
              />
              <Button variant="primary" onClick={() => this.saveResearchInfo('objective')}>Add</Button> 
            </div>
            <ListGroup>
              {objectives.map((objective, index) => (
                <ListGroup.Item key={index}>
                  {editObjectives[index] ? (
                    <>
                      <Form.Control
                        type="text"
                        value={objective['value']}
                        onChange={(e) => this.handleTemporaryChange('objective', e, index)}
                      />
                      <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                        <Button
                          variant="success"
                          size="sm"
                          style={{marginRight: '3px'}}
                          onClick={() => this.saveResearchInfo('objective', 'edit', index)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => this.toggleEdit('objective', index, false)}
                        >
                          Not Edit
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {objective['value']} ({objective['created_by']})
                      {
                        isOwner || username == objective['created_by'] ? 
                        <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                          <Button
                            variant="info"
                            size="sm"
                            style={{marginRight: '3px'}}
                            onClick={() => this.toggleEdit('objective', index)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => this.saveResearchInfo('objective', 'remove', index)}
                          >
                            Remove
                          </Button>
                        </div> : <></>
                      }
                    </>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup> 
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold' }}>5. Research Questions:</label>
            <div className="d-flex align-items-center mt-2 mb-4" >
              <Form.Control
                type="text"
                placeholder="Add research questions"
                value={newQuestion}
                onChange={(e) => this.handleTemporaryChange('question', e)}
                style={{marginRight: '7px'}}
              />
              <Button variant="primary" onClick={() => this.saveResearchInfo('question')}>Add</Button> 
            </div>
            <ListGroup>
              {questions.map((question, index) => (
                <ListGroup.Item key={index}>
                  {editQuestions[index] ? (
                    <>
                      <Form.Control
                        type="text"
                        value={question['value']}
                        onChange={(e) => this.handleTemporaryChange('question', e, index)}
                      />
                      <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                        <Button
                          variant="success"
                          size="sm"
                          style={{marginRight: '3px'}}
                          onClick={() => this.saveResearchInfo('question', 'edit', index)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => this.toggleEdit('question', index, false)}
                        >
                          Not Edit
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {question['value']} ({question['created_by']})
                      {
                        isOwner || username == question['created_by'] ? 
                        <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                          <Button
                            variant="info"
                            size="sm"
                            style={{marginRight: '3px'}}
                            onClick={() => this.toggleEdit('question', index)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => this.saveResearchInfo('question', 'remove', index)}
                          >
                            Remove
                          </Button>
                        </div> : <></>
                      }
                    </>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup> 
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold' }}>6. Research Sub Questions:</label>
            <div className="d-flex align-items-center mt-2 mb-4" >
              <Form.Control
                type="text"
                placeholder="Add sub-research questions"
                value={newSubQuestion}
                onChange={(e) => this.handleTemporaryChange('subQuestion', e)}
                style={{marginRight: '7px'}}
              />
              <Form.Select
                defaultValue={0}
                onChange={(e) => this.handleTemporaryChange('questionGroup', e)}
                required
                style={{width: '200px', marginRight: '7px'}}
              >
                <option value={0} disabled>- For which RQ -</option>
                {
                  originalQuestions.map((question, index) => (
                    <option value={question['_id']} key={index}>RQ {index+1}</option>
                  ))
                }
              </Form.Select>
              <Button variant="primary" onClick={() => this.saveResearchInfo('subQuestion')}>Add</Button> 
            </div>
            <ListGroup>
              {questions.map((question, index) => (
                <ListGroup.Item key={index}>
                  RQ{index+1}: {question['value']}
                  {
                    originalSubQuestions.map((subQuestion, subIndex) => 
                      {
                        if (subQuestion['question_id'] == question['_id']) {
                          return <Card key={subIndex} style={{padding: '5px', margin: '3px'}}>
                          {subQuestion['value']} ({subQuestion['created_by']})
                          {
                            isOwner || username == subQuestion['created_by'] ? 
                            <div className="mt-3" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => this.saveResearchInfo('subQuestion', 'remove', subIndex)}
                              >
                                Remove
                              </Button>
                            </div> : <></>
                          }
                        </Card>
                        } else {
                          return <></>
                        }
                      }                    
                    )
                  } 
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold' }}>7. Research Keywords:</label>
            <div className="d-flex align-items-center mt-2 mb-4" >
              <Form.Control
                type="text"
                placeholder="Add research keywords"
                value={newKeyword}
                onChange={(e) => this.handleTemporaryChange('keyword', e)}
                style={{marginRight: '7px'}}
              />
              <Button variant="primary" onClick={() => this.saveResearchInfo('keyword')}>Add</Button> 
            </div>
            {keywords.map((keyword, index) => (
              <div key={index}
                className=" d-inline-block position-relative p-2 rounded border"
                style={{marginRight: '5px', marginBottom: '3px', display: 'flex'}}
              >
                {keyword['value']} ({keyword['created_by']})&nbsp;&nbsp;
                {
                  isOwner || username == keyword['created_by'] ? <>
                  <Button
                    size="sm"
                    style={{ backgroundColor: 'transparent', marginLeft: '3px', display: 'flex' }}
                    className="close-button position-absolute top-0 end-0 p-0 border-0"
                    onClick={() => this.saveResearchInfo('keyword', 'remove', index)}
                  > 
                    <FontAwesomeIcon icon={faTimes} className="text-black"
                    style={{marginTop: '1px', marginRight: '1px'}}/>
                  </Button>
                  </> : <></>
                }
              </div> 
            ))}
          </div>
          <div className="mt-3"> {/* Center text and buttons */}
            <label style={{ fontWeight: 'bold' }}>8. Quality Assessment Questions:</label>
            <div className="d-flex align-items-center mt-2 mb-4" >
              <Form.Control
                type="text"
                placeholder="Add quality assessment questions"
                value={newQltyQuestion}
                onChange={(e) => this.handleTemporaryChange('qltyQuestion', e)}
                style={{marginRight: '7px'}}
              />
              <Button variant="primary" onClick={() => this.saveResearchInfo('qltyQuestion')}>Add</Button> 
            </div>
            <ListGroup>
              {qltyQuestions.map((qltyQuestion, index) => (
                <ListGroup.Item key={index}>
                  {editQltyQuestions[index] ? (
                    <>
                      <Form.Control
                        type="text"
                        value={qltyQuestion['value']}
                        onChange={(e) => this.handleTemporaryChange('qltyQuestion', e, index)}
                      />
                      <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                        <Button
                          variant="success"
                          size="sm"
                          style={{marginRight: '3px'}}
                          onClick={() => this.saveResearchInfo('qltyQuestion', 'edit', index)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => this.toggleEdit('qltyQuestion', index, false)}
                        >
                          Not Edit
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {qltyQuestion['value']} ({qltyQuestion['created_by']})
                      {
                        isOwner || username == qltyQuestion['created_by'] ? 
                        <div className="mt-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}> {/* New line for buttons */}
                          <Button
                            variant="info"
                            size="sm"
                            style={{marginRight: '3px'}}
                            onClick={() => this.toggleEdit('qltyQuestion', index)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => this.saveResearchInfo('qltyQuestion', 'remove', index)}
                          >
                            Remove
                          </Button>
                        </div> : <></>
                      }
                    </>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup> 
          </div>
        </div>
      </Col>
    );
  }
}

export default RightSidebar;
