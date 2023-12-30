import React, { Component } from 'react';
import { Container, Row, Col, Card, Table, Button, Form} from 'react-bootstrap';
import Papa from 'papaparse';
import AppContext from '../AppContext';

class ReferenceSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      validCsvData: [],
      database: 'pubmed',
      minYear: 2010,
      maxYear: new Date().getFullYear(),
      logicalOperator: 'AND',
      field: 'Title/Abstract',
      value: '',
      queryString: '',
      pageNumber: 1,
      totalPages: 0,
      totalResults: 0,
      loading: false,
    };
  }

  static contextType = AppContext;

  databases = [
    {
      "label": "PubMed",
      "value": "pubmed"
    },
    {
      "label": "Scopus",
      "value": "scopus"
    },
  ];

  operators = {
    "AND": {
      "label": "AND",
      "value": {
        "pubmed": "AND",
        "scopus": "AND"
      },
    },
    "OR": {
      "label": "OR",
      "value": {
        "pubmed": "OR",
        "scopus": "OR"
      },
    },
    "NOT": {
      "label": "NOT",
      "value": {
        "pubmed": "NOT",
        "scopus": "AND NOT"
      },
    },
  }

  fields = {
    "Title/Abstract": {
      "label": "Title/Abstract",
      "value": {
        "pubmed": "[Title/Abstract]",
        "scopus": "TITLE-ABS"
      }
    },
    "Title/Abstract/Keyword": {
      "label": "Title/Abstract/Keyword",
      "value": {
        "scopus": "TITLE-ABS-KEY"
      }
    },
    "Title": {
      "label": "Title",
      "value": {
        "pubmed": "[Title]",
        "scopus": "TITLE"
      }
    },
    "Abstract": {
      "label": "Abstract",
      "value": {
        "pubmed": "[Abstract]",
        "scopus": "ABS"
      }
    },
    "Keyword": {
      "label": "Keyword",
      "value": {
        "scopus": "KEY"
      }
    },
    "Language": {
      "label": "Language",
      "value": {
        "pubmed": "[la]",
        "scopus": "LANGUAGE"
      }
    },
    "Journal": {
      "label": "Journal",
      "value": {
        "pubmed": "[Journal]",
      }
    },
    "Conference": {
      "label": "Conference",
      "value": {
        "scopus": "CONFNAME",
      }
    },
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {
  };

  handleSort = (column) => {
    const { sortBy, sortOrder } = this.state;

    if (column === sortBy) {
      // Toggle sort order if the same column is clicked
      this.setState({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      // Set new sort column and default to ascending order
      this.setState({ sortBy: column, sortOrder: 'asc' });
    }
  };

  addRule = (e) => {
    e.preventDefault();

    let generatedString = '';

    if (this.state.value != '') {
    const newRule = {
      logicalOperator: this.operators[this.state.logicalOperator]['value'][this.state.database],
      field: this.fields[this.state.field]['value'][this.state.database],
      value: this.state.value,
    };


    // This callback will be executed after the state is updated
    if (this.state.database == 'pubmed') {
      generatedString = `${newRule.logicalOperator}("${newRule.value}"${newRule.field})`;
    }
    else if (this.state.database == 'scopus') {
      if (this.state.queryString == '' && newRule.logicalOperator == 'AND') {
        generatedString = `(${newRule.field}(${newRule.value}))`;
      } else {
        generatedString = `${newRule.logicalOperator}(${newRule.field}(${newRule.value}))`;
      }
    } 

  
    this.setState((prevState) => ({ queryString: `${prevState.queryString}${generatedString}` }));
    this.setState({value: ''})}
  };

  handleChange = (field, value) => {
    this.setState({
      [field]: value,
    })
  };

  handleSearch = (pageNumber=0) => {
    if (parseInt(this.state.minYear) > parseInt(this.state.maxYear) || parseInt(this.state.maxYear) < parseInt(this.state.minYear)) {
      this.context.handleShowNoti({
        level: 'error',
        message: 'Year must be valid'
      });
    }
    else if (this.state.queryString == '') {
      this.context.handleShowNoti({
        level: 'error',
        message: 'Fill in query string'
      });
    }
    else {
      const pro_id = this.context.project['pro_id'];
      const endpoint = `find_references`;
      const method = 'POST';
      const headers = {
        'Content-Type': 'application/json'
      };
      const body = { 
        'pro_id': pro_id, 
        'query_string': this.state.queryString,
        'database': this.state.database,
        'min_year': this.state.minYear,
        'max_year': this.state.maxYear,
        'page_number': pageNumber
      };

      this.setState({loading: true})
      this.context.handleApiRequest(endpoint, method, headers, body)
      .then((responseData) => {
        this.setState({ 
          validCsvData: responseData.data,
          totalPages: responseData.totalPages,
          totalResults: responseData.totalResults,
          pageNumber: responseData.pageNumber,
          loading: false
        });
      })
      .catch((error) => {
        this.setState({ loading: false });
      });
    }
  }

  // Function to trigger the download of the CSV file
  downloadCSV = () => {
    const csvData = Papa.unparse(this.state.validCsvData, {
      quotes: true, // Use quotes as text qualifier
      delimiter: ',', // Set the delimiter
      header: true, // Include header in the CSV
    });

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'exported_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Your browser does not support the download functionality. Please try another browser.');
    }
  };

  render() {
    const { validCsvData,  rules } = this.state;

    const options = [];
    for (let index = 1; index <= this.state.totalPages; index++) {
      options.push(
        <option value={index} key={index}>
          {index}
        </option>
      );
    }
    const columns = [
        'Title',
        'Authors',
        'Year',
        'Source title',
        'Abstract',
      ];

    return (
        <Container fluid>
        {this.state.loading && (
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
          <Col sm={12}>
            <Card className='mt-2 mb-2'>
              <Card.Body>
                <Row>
                  <Col>
                    <Row> {/* Center text and buttons */}
                      <Col sm={4}>
                        <label style={{ fontWeight: 'bold' }}>Database :</label>
                        <Form.Select
                          defaultValue={''}
                          onChange={(e) => this.handleChange('database', e.target.value)}
                          >
                          {
                            this.databases.map((item, index) => <option key={index} value={item['value']}>{item['label']}</option>)
                          }
                        </Form.Select>
                      </Col>
                      <Col sm={4}>
                        <label style={{ fontWeight: 'bold' }}>Min Year :</label>
                        <Form.Control
                          type="number"
                          defaultValue={2010}
                          min={2000}
                          max={2023}
                          required
                          onChange={(e) => this.handleChange('minYear', e.target.value)}
                        />
                      </Col>
                      <Col sm={4}>
                        <label style={{ fontWeight: 'bold' }}>Max Year :</label>
                        <Form.Control
                          type="number"
                          defaultValue={new Date().getFullYear()}
                          min={2000}
                          max={new Date().getFullYear()}
                          required
                          onChange={(e) => this.handleChange('maxYear', e.target.value)}
                        />
                      </Col>
                    </Row>
                  </Col>
                  <Col>
                    <label style={{ fontWeight: 'bold' }}>Query string :</label>
                    <div className='text-center'>
                      <div className="mb-1">
                        <Form className="text-center" onSubmit={this.addRule}>
                          <Row className="justify-content-between">
                              <Col sm={2}>
                              <Form.Group>
                                <Form.Select
                                defaultValue={'AND'}
                                onChange={(e) => this.handleChange('logicalOperator', e.target.value)}
                                >
                                {
                                  Object.keys(this.operators).map((key, index) => 
                                    <option key={index} value={key}>{this.operators[key]['label']}</option>
                                  )
                                }
                                </Form.Select>
                              </Form.Group>
                              </Col>
                              <Col sm={4}>
                              <Form.Group>
                                <Form.Select
                                  defaultValue={''}
                                  required
                                  onChange={(e) => this.handleChange('field', e.target.value)}
                                  >
                                  {
                                    Object.keys(this.fields).map((key, index) => {
                                      if (this.state.database in this.fields[key]['value'])
                                        return (<option key={index} value={key}>{this.fields[key]['label']}</option>)
                                      else {
                                        return (<></>)
                                      }
                                    })
                                  }
                                  </Form.Select>
                              </Form.Group>
                              </Col>
                              <Col sm={5}>
                                <Form.Group>
                                {
                                  this.state.field == 'Language' ? 
                                  <Form.Select
                                    required
                                    defaultValue={'eng'}
                                    onChange={(e) => this.handleChange('value', e.target.value)}
                                    >
                                      <option value="">--Select a language--</option>
                                      <option value="english">English</option>
                                      <option value="french">French</option>
                                  </Form.Select> : 
                                  <Form.Control
                                    type="text"
                                    placeholder='Type something'
                                    value={this.state.value}
                                    required
                                    onChange={(e) => this.handleChange('value', e.target.value)}
                                  />
                                }
                                </Form.Group>
                              </Col>
                              <Col sm={1}>
                              <Button variant="primary" type="submit" style={{width: '100%'}}>
                                  +
                              </Button>
                              </Col>
                          </Row>
                        </Form>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          style={{marginTop: '10px'}}
                          value={this.state.queryString}
                          required
                          onChange={(e) => this.handleChange('queryString', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button variant="primary" onClick={() => this.handleSearch()} className="mt-2">
                        Search
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            {this.state.totalResults ? 
              <div className="mb-1">
                <Row>
                  <Col sm={1}>
                    <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                      Results: {this.state.totalResults}
                    </div>
                  </Col>
                  <Col sm={1} style={{marginRight: '20px'}}>
                    <div style={{ display: 'flex', marginBottom: '5px'}}>
                      <label>Page: </label>
                      <Form.Select
                        required
                        value={this.state.pageNumber}
                        onChange={(e) => this.handleSearch(e.target.value)}
                        style={{width: '65px', marginLeft: '10px'}}
                        >
                        <option value="0">--Select a page--</option>
                        {options}
                      </Form.Select>
                    </div>
                  </Col>
                  <Col sm={1}>
                    <Button variant="primary" onClick={this.downloadCSV}>
                      Download
                    </Button>
                  </Col>
                </Row>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <Table striped bordered hover>
                    <thead>
                        <tr>
                        <th>ID</th>
                        {columns.map((column) => (
                            <th key={column} 
                            // onClick={() => this.handleSort(column)}
                            >
                            {column} 
                            {/* {sortBy === column && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>} */}
                            </th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {validCsvData.map((row, index) => (
                        <tr key={index}>
                          <td>{index+1}</td>
                          {columns.map((column) => (
                          <td key={column}>
                            {row[column]}
                          </td>
                          ))}
                        </tr>
                        ))}
                    </tbody>
                    </Table>
                </div>
              </div> : <></>
            }
          </Col>
        </Row>
      </Container>
    );
  }
}

export default ReferenceSearch;
