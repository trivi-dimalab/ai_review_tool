import React, { Component } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import AppContext from '../AppContext';

class ReferenceInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: '',
      sourceTitle: '',
      authors: '',
      keywords: '',
      abstract: '',
      link: '',
      year: new Date().getFullYear(),
      loading: false,
      referenceId: (new URLSearchParams(window.location.search)).get('reference_id', ''),
    };
  }

  static contextType = AppContext;

  componentDidMount() {
    const {referenceId} = this.state;
    const pro_id = this.context.project['pro_id'];

    if (referenceId) {
      const endpoint = `get_reference_info?pro_id=${pro_id}&ref_id=${referenceId}`;
      const method = 'GET';
      const headers = {};
      const body = null;

      this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        const data = responseData['reference_info'];

        this.setState({
          title: data['title'] || '',
          sourceTitle: data['source_title'] || '',
          authors: data['authors'] || '',
          keywords: data['keywords'] || '',
          year: data['year'] || new Date().getFullYear(),
          link: data['link'] || '',
          abstract: data['abstract'] || ''
        })
      })
      .catch((error) => {});
    }
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  handleSave = (e) => {
    e.preventDefault();

    const {referenceId} = this.state;

    const modalInfo = {
      level: 'update',
      message: `Do you want to ${referenceId ? 'update' : 'add'} this reference?`,
      onYes: () => this.handleUpload()
    };
    this.context.handleShowModal(modalInfo);
  }

  handleUpload = () => {
    const {referenceId} = this.state;
    const pro_id = this.context.project['pro_id'];

    const endpoint = referenceId
      ? `update_reference`
      : 'add_reference';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json'
    };
    const body = {...this.state, 'pro_id': pro_id, 'update_type': referenceId ? 'edit' : 'add'};

    this.context.handleApiRequest(endpoint, method, headers, body)
    .then((responseData) => {
      this.context.handleShowNoti({
        level: 'success',
        message: responseData.message
      });
    })
    .catch((error) => {});
  };

  render() {
    const {title, abstract, keywords, year, link, authors, sourceTitle, loading, referenceId} = this.state;

    return (
        <Container fluid>
            {loading && (
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
                <div className="sr-only ml-2">Searching...</div>
            </div>
            )}
            <Row>
                <Row className="justify-content-center">
                    <Col sm={8} className="align-items-center">
                        <div style={{width: '100%', textAlign: 'center', marginTop: '20px'}}>
                            <h1>
                                {referenceId ? 'Edit reference' : 'New reference'}
                            </h1>
                        </div>
                        <Form onSubmit={this.handleSave}>
                            <Form.Group controlId="formTitle" className="mt-2">
                                <Form.Label>Title</Form.Label>
                                <Form.Control
                                type="text"
                                name="title"
                                value={title}
                                required
                                onChange={this.handleChange}
                                />
                            </Form.Group>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <Form.Group controlId="formSourceTitle" className="mt-2" style={{width: '48%'}}>
                                <Form.Label>Source Title (from which journals, conferences, etc.)</Form.Label>
                                <Form.Control
                                type="text"
                                name="sourceTitle"
                                value={sourceTitle}
                                onChange={this.handleChange}
                                />
                            </Form.Group>

                            <Form.Group controlId="formYear" style={{width: '48%'}} className="mt-2">
                                <Form.Label>Year</Form.Label>
                                <Form.Control
                                type="number"
                                name="year"
                                value={year}
                                onChange={this.handleChange}
                                />
                            </Form.Group>
                            </div>

                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                              <Form.Group controlId="formAuthors" style={{width: '48%'}} className="mt-2">
                                  <Form.Label>Authors</Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="authors"
                                    value={authors}
                                    onChange={this.handleChange}
                                  />
                              </Form.Group>
                                <Form.Group controlId="formKeywords" style={{width: '48%'}} className="mt-2">
                                    <Form.Label>Keywords</Form.Label>
                                    <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="keywords"
                                    value={keywords}
                                    onChange={this.handleChange}
                                    />
                                </Form.Group>
                            </div>

                            <Form.Group controlId="formAbstract" className="mt-2">
                                <Form.Label>Abstract</Form.Label>
                                <Form.Control
                                as="textarea"
                                rows={7}
                                name="abstract"
                                value={abstract}
                                onChange={this.handleChange}
                                />
                            </Form.Group>
                            <Form.Group controlId="formLink" className="mt-2">
                                <Form.Label>Link</Form.Label>
                                <Form.Control
                                type="text"
                                name="link"
                                value={link}
                                required
                                onChange={this.handleChange}
                                />
                            </Form.Group>

                            
                            <div style={{width: '100%', textAlign: 'center'}}>
                                <Button variant="primary" type="submit" className="mt-2">
                                    {referenceId ? 'Update' : 'Save'}
                                </Button>
                            </div>
                        </Form>
                    </Col>
                </Row>
            </Row>
        </Container>
    );
  }
}

export default ReferenceInfo;
