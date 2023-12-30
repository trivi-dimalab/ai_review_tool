import React, { Component } from 'react';
import { Modal, Button } from 'react-bootstrap';

class CustomModal extends Component {
  constructor(props) {
    super(props);
  }

  // Function to map level to Bootstrap variant
  getButtonVariant = (level) => {
    switch (level) {
      case 'delete':
        return 'danger';
      case 'update':
        return 'warning';
      case 'info':
        return 'info';
      case 'cancel':
        return 'secondary';
      default:
        return 'primary'; // Default variant
    }
  };

  // Function to map level to Bootstrap variant
  getHeaderColor = (level) => {
    switch (level) {
      case 'delete':
        return 'red';
      case 'update':
        return 'orange';
      case 'info':
        return 'blue';
      case 'cancel':
        return 'gray';
      default:
        return 'gray'; // Default variant
    }
  };

  // Function to map level to Bootstrap variant
  getModalHeader = (level) => {
    switch (level) {
      case 'delete':
        return 'Delete confirmation';
      case 'update':
        return 'Update confirmation';
      case 'info':
        return 'Info';
      default:
        return 'Message'; // Default variant
    }
  };

  render() {
    const { level = 'primary', message = '', onYes = () => {} } = this.props.modalInfo;

    return this.props.isShow ? (
      <Modal show={true} onHide={this.props.onClose} className={`modal level-${level}`}>
        <Modal.Header closeButton className={`modal-header level-${level}`} style={{backgroundColor: this.getHeaderColor(level)}}>
          <Modal.Title>{this.getModalHeader(level)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{message}</p>
          <div style={{display: 'flex', justifyContent: 'center'}}>
              <Button
                style={{marginRight: '3px'}}
                variant={this.getButtonVariant('cancel')}
                onClick={this.props.onClose}
              >
                No
              </Button>
              <Button
                style={{marginRight: '3px'}}
                variant={this.getButtonVariant('info')}
                onClick={onYes}
              >
               Yes
              </Button>
          </div>
        </Modal.Body>
      </Modal>
    ) : <></>
  }
}

export default CustomModal;
