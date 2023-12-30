import React, { useContext, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faRobot, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Row, Col, Dropdown } from 'react-bootstrap';
import AppContext from '../AppContext';

const ChatMessage = ({ message = '', isUser, onHandleSelect, updateResearchInfo, isSave=true }) => {
  const icon = isUser ? faUser : faRobot;

  const [showDropdown, setShowDropdown] = useState(false);
  const {project, handleApiRequest, handleShowNoti } = useContext(AppContext);
  const isOwner = project['mem_role'] == 'owner' ? true : false;

  const [dropdownOptions, setDropdownOptions] = useState([
    { 'show_user': false, 'value': 'topic' },
    { 'show_user': false, 'value': 'description' },
    { 'show_user': false, 'value': 'title' },
    { 'show_user': true, 'value': 'objective' },
    { 'show_user': true, 'value': 'question' },
    { 'show_user': true, 'value': 'keyword' },
    { 'show_user': true, 'value': 'qltyQuestion' },
  ]);

  const [selectedLine, setSelectedLine] = useState(null);

  const messageLines = message.split(/\n\n|\n/);

  const handleArrowClick = (line) => {
    setSelectedLine(line); // Track the line associated with the dropdown
    setShowDropdown(true);
  };

  const generateText = (text) => {
    if (text == 'qltyQuestions') {
      return 'quality assessment questions'
    } else {
      return `research ${text}`
    }
  }

  const handleOptionSelect = async (field, newValue, changeType) => {
    setShowDropdown(false);

    if (newValue != 'None') {
      // Get the Bearer token from localStorage

      const pro_id = project['pro_id'];
      const endpoint = 'change_project_info';
      const method = 'POST';
      const headers = {
        'Content-Type': 'application/json',
      };

      const body = {
        'pro_id': pro_id,
        'field': field,
        'new_value': newValue.replace(/\d+\.\s/g, ''),
        'change_type': changeType,
        'parent_id': '',
        'is_info': true,
      }
      
      const response = await handleApiRequest(endpoint, method, headers, body);
      // Handle the response from Flask and update your chat

      if (response.success) {
        updateResearchInfo(response.researchInfo);
        handleShowNoti({
          level: response.error ? 'error' : 'success',
          message: response.message,
          callback: () => { },
        });
      }
    }
  };

  return (
    <div className={`chat-message`}>
      <div className={isUser ? 'd-flex flex-row-reverse' : 'd-flex flex-row'}>
        <div className="message-icon" style={{ margin: '10px' }}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="message-text" style={{ margin: '10px' }}>
          {messageLines.map((line, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
              {line ? line : isUser ? '' : 'Something error'}
              {line === selectedLine && showDropdown ? (
                <Dropdown style={{marginLeft: '3px'}}>
                  <Dropdown.Toggle variant="success" id={`dropdown-${index}`}>
                    Select an option
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {dropdownOptions.map((option, i) => (
                      (option['show_user'] || isOwner) ? (
                        <Dropdown.Item key={i} onClick={() => handleOptionSelect(option['value'], line, 'add')}>
                          {`Save as ${generateText(option['value'])}`}
                        </Dropdown.Item>
                      ) : (
                        <React.Fragment key={i}></React.Fragment>
                      )
                    ))}
                    <Dropdown.Item key={dropdownOptions.length} onClick={() => handleOptionSelect('None', line)}>
                      {`None`}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (line && isSave ? (
                <FontAwesomeIcon
                  icon={faChevronDown}
                  style={{ cursor: 'pointer', marginLeft: '10px' }}
                  onClick={() => handleArrowClick(line)}
                />
              ) : <></>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
