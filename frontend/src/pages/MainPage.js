import React, { Component } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import RightSidebar from '../components/RightSidebar';
import ChatMessageList from '../components/ChatMessageList';
import ChatInput from '../components/ChatInput';
import AppContext from '../AppContext';

class MainPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chatMessages: [],
      researchInfo: [], // Initialize researchInfo as an empty array
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
          chatMessages: responseData['data']['chatMessages'],
          researchInfo: responseData['data']['researchInfo']
      });
    })
    .catch((error) => {});

  }

  handleMessageSent = (message) => {
    this.setState((prevState) => ({
      chatMessages: [...prevState.chatMessages, message],
    }));
  }

  // Function to update research info in the state
  updateResearchInfo = (newInfo) => {
    this.setState({ researchInfo: newInfo });
  }


  render() {
    const { chatMessages, researchInfo } = this.state; // Get researchInfo from the state

    return (
      <Container fluid> 
        <Row>
          <Col sm={7}>
            <ChatMessageList messages={chatMessages} className="overflow-auto" updateResearchInfo={this.updateResearchInfo} />
            <ChatInput endpoint={"send_message_step_1"} onMessageSent={this.handleMessageSent} className="sticky-bottom" />
          </Col>
          <Col sm={5}>
            <RightSidebar researchInfo={researchInfo} /> {/* Pass researchInfo to RightSidebar */}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default MainPage;
