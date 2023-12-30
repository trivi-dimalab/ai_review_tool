import React, { Component } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import RightSidebar3 from '../components/RightSidebar3';
import AppContext from '../AppContext';
import ChatMessageList from '../components/ChatMessageList';
import ChatInput from '../components/ChatInput';

class DocumentSynthesis extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chatMessages: [],
      referenceInfo: {}, // Initialize referenceInfo as an empty array,
      response: '',
    };
  }

  static contextType = AppContext

  componentDidMount() {
    const endpoint = `get_project_info?pro_id=${this.context.project['pro_id']}`;
    const method = 'GET';
    const headers = {};
    const body = null;

    this.context.handleApiRequest(endpoint, method, headers, body)
    .then((responseData) => {
      this.setState({ 
        referenceInfo: responseData['data']['researchInfo'],
        chatMessages: responseData['data']['synthesisMessages']
      });
    })
    .catch((error) => {});
  }


  // Function to update research info in the state
  updateResponse = (txt) => {
    this.setState({ response: txt });
  }

  handleMessageSent = (message) => {
    this.setState((prevState) => ({
      chatMessages: [...prevState.chatMessages, message],
    }));
  }

  render() {
    const { referenceInfo, chatMessages } = this.state; // Get referenceInfo from the state

    return (
      <Container fluid>
        <Row style={{ maxHeight: '100vh' }}>
          <Col sm={7}>
            <ChatMessageList isSave={false} messages={chatMessages} updatedocumentInfo={this.updatedocumentInfo} />
            <ChatInput endpoint={"write_text"} className="sticky-bottom" onMessageSent={this.handleMessageSent}/>
          </Col>
          <Col sm={5}>
            <RightSidebar3 referenceInfo={referenceInfo} updateResponse={this.updateResponse} onMessageSent={this.handleMessageSent}/>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default DocumentSynthesis;
