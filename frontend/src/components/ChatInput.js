import React, { Component } from 'react';
import { Button, Form } from 'react-bootstrap';
import AppContext from '../AppContext';

class ChatInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      isSending: false,
    };
  }

  static contextType = AppContext;

  handleChange = (e) => {
    this.setState({ message: e.target.value });
  }

  handleSend = async () => {
    const { message } = this.state;

    if (message.trim() === '') {
      return;
    }

    this.setState({ isSending: true });

    // Add user's message to the chat first
    this.props.onMessageSent({ content: message, role: 'user' });

    const pro_id = this.context.project['pro_id'];
    const endpoint = this.props.endpoint;
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

    this.setState({ message: '', isSending: false });
  }

  render() {
    const { message, isSending } = this.state;

    return (
      <div className="chat-input" style={{ marginTop: '10px' }}>
        <Form>
          <Form.Control
            as="textarea"
            placeholder="Type a message..."
            value={message}
            onChange={this.handleChange}
            disabled={isSending}
            rows={4}
            style={{ width: '100%'}}
          />
          <div className="text-center mt-2">
          <Button
            variant="primary"
            onClick={this.handleSend}
            disabled={isSending}
            block
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
          </div>
        </Form>
      </div>
    );
  }
}

export default ChatInput;