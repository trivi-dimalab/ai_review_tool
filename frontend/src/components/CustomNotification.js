import React, { Component } from 'react';
import { Modal, Button } from 'react-bootstrap';

class CustomNotification extends Component {
  constructor(props) {
    super(props);
  }

  // Function to map level to Bootstrap variant
  getHeaderColor = (level) => {
    switch (level) {
      case 'error':
        return 'red';
      case 'success':
        return 'green';
      case 'warning':
        return 'orange';
      default:
        return 'blue'; // Default variant
    }
  };

  // Function to map level to Bootstrap variant
  getModalHeader = (level) => {
    switch (level) {
      case 'error':
        return 'Error';
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      default:
        return 'Success'; // Default variant
    }
  };

  render() {
    const { level = 'success', message = '' } = this.props.notiInfo;

    return this.props.isShow ? (
      <Modal show={true} className={`modal level-${level}`}>
        <Modal.Header closeButton={false} className={`modal-header level-${level}`} style={{backgroundColor: this.getHeaderColor(level)}}>
          <Modal.Title>{this.getModalHeader(level)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{message}</p>
        </Modal.Body>
      </Modal>
    ) : <></>
  }
}

export default CustomNotification;
