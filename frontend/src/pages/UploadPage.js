import React, { Component } from 'react';
import { Container, Row, Col, Table, Form, Button } from 'react-bootstrap';
import Papa from 'papaparse';
import AppContext from '../AppContext';

class UploadPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
        csvData: [],
        file: null,
      };
  }

  static contextType = AppContext;

  handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    this.setState({ file: selectedFile });

    if (selectedFile) {
      Papa.parse(selectedFile, {
        complete: (result) => {
          // 'result' contains the parsed data
          const data = result.data;
          const filteredData = data.map(item => ({
            Authors: item['Authors'],
            Title: item['Title'],
            Year: item['Year'],
            'Source title': item['Source title'],
            Abstract: item['Abstract'],
            'Keywords': item['Keywords'],
            Link: item['Link'],
          }));
  
          this.setState({ csvData: filteredData });
        },
        header: true, // Assumes the first row is the header
        dynamicTyping: true, // Parse numeric values as numbers
        skipEmptyLines: true, // Skip empty lines
        delimiter: ',', // Set the delimiter if it's different from a comma
      });
    }
  }

  handleImportData = () => {
    const modalInfo = {
      level: 'update',
      message: `Do you want to import this reference file?`,
      onYes: () => this.handleUpload()
    };
    this.context.handleShowModal(modalInfo);
  };

  handleUpload = () => {
    const { csvData } = this.state;
    const pro_id = this.context.project['pro_id'];

    const endpoint = `upload_references`;
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json'
    };
    const body = { 'pro_id': pro_id, 'csv_data': csvData};

    this.context.handleApiRequest(endpoint, method, headers, body)
    .then((responseData) => {
      this.setState({
        csvData: [],
        file: null
      });

      this.context.handleShowNoti({
        level: 'success',
        message: responseData.message
      });
    })
    .catch((error) => {});
  }

  // Function to update research info in the state
  render() {
    const { file, csvData } = this.state;

    return (
      <Container fluid>
        <Row>
          <Col sm={12}>
            <div>
                <Form.Group>
                <Form.Label>Upload CSV File</Form.Label>
                <Form.Control type="file" accept=".csv" onChange={this.handleFileChange} />
                </Form.Group>
                {file && (
                <>
                    <div className="text-center" style={{width:'100%'}}>
                        <Button variant="primary" onClick={this.handleImportData} className='text-center mt-3 mb-3'>
                            Import
                        </Button>
                    </div>
                    <Table striped bordered hover>
                    <thead>
                        <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Authors</th>
                        <th>Year</th>
                        <th>Source title</th>
                        <th>Abstract</th>
                        <th>Keywords</th>
                        <th>Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {csvData.map((item, index) => (
                        <tr key={index}>
                            <td>{index+1}</td>
                            <td>{item['Title']}</td>
                            <td>{item['Authors']}</td>
                            <td>{item['Year']}</td>
                            <td>{item['Source title']}</td>
                            <td>{item['Abstract']}</td>
                            <td>{item['Keywords']}</td>
                            <td>{item['Link']}</td>
                        </tr>
                        ))}
                    </tbody>
                    </Table>
                </>
                )}
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default UploadPage;
