import React, { Component } from 'react';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import MultiSelect from  'react-multiple-select-dropdown-lite'
import 'react-multiple-select-dropdown-lite/dist/index.css'
import AppContext from '../AppContext';

class FullTextScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      references: []
    }
  }

  static contextType = AppContext;

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {
    const endpoint = `get_references?pro_id=${this.context.project['pro_id']}&status=screened`;
    const method = 'GET';
    const headers = {};
    const body = null;

    this.context.handleApiRequest(endpoint, method, headers, body)
    .then((responseData) => {
      this.setState({ 
        references: responseData['references'],
      });
    })
    .catch((error) => {});
  };
  
  render() {
    const { references } = this.state;
    const colorMap = {
      unscreen: 'primary',
      screened: 'success',
      selected: 'info',
      invalid_1: 'warning',
      invalid_2: 'danger',
    };

    return (
      <Container fluid>
        <Row>
          <Col sm={12}>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <td style={{width: '2%'}}>ID</td>
                  <td style={{width: '25%'}}>Title</td>
                  <td style={{width: '25%'}}>PDF File</td>
                  <td>Quality Assessment</td>
                  <td style={{width: '20%'}}>Status</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {references.map((row, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{row['title']}</td>
                    <td>{row['pdf'] ? row['pdf']['originalName'] : 'Not uploaded yet'}</td>
                    <td style={{width: "200px", textAlign: 'center'}}>
                      {`${row['num_qlty_responses']}/${row['num_qlty_questions']} (answered)`}
                    </td>
                    <th>
                      {
                        row['status'].map((ele, index) => 
                        <Button
                          key={index}
                          variant={colorMap[ele]}
                          style={{ marginRight: '5px', marginBottom: '5px' }}
                        >
                          {ele}
                        </Button>)
                      }
                    </th>
                    <td style={{width: "200px", textAlign: 'center'}}>
                      {/* Corrected Button prop to 'to' for React Router */}
                      <Link to={`/reference-full-screen?reference_id=${row['_id']}`}>
                        <Button>Full-text screen</Button>
                      </Link>                    
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default FullTextScreen;
