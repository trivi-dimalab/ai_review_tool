import React, { Component } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Accordion } from 'react-bootstrap';
import MultiSelect from 'react-multiple-select-dropdown-lite'
import 'react-multiple-select-dropdown-lite/dist/index.css'
import AppContext from '../AppContext';

class PracticalScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      validCsvData: [],
      invalidCsvData: [],
      sortBy: null,
      sortOrder: 'asc', // Initial sort order is ascending
      rules: [],
      validFilterWords: {},
      invalidFilterWords: {},
      keywords: [],
      availableFields: {
        "abstract,title,keywords": {
            "conditions": ["includes all", "include one in"],
            "values": {
                "type": "multi-select",
            }
        },
        "abstract,title": {
            "conditions": ["includes all", "include one in"],
            "values": {
                "type": "multi-select",
            }
        },
        "abstract,keywords": {
            "conditions": ["includes all", "include one in"],
            "values": {
                "type": "multi-select",
            }
        },
        "title,keywords": {
            "conditions": ["includes all", "include one in"],
            "values": {
                "type": "multi-select",
            }
        },
        "abstract": {
            "conditions": ["includes all", "include one in"],
            "values": {
                "type": "multi-select",
            }
        },
        "title": {
            "conditions": ["includes all", "include one in"],
            "values": {
                "type": "multi-select",
            }
        },
        "source_title": {
            "conditions": ["includes all", "include one in"],
            "values": {
                "type": "multi-select",
            }
        },
        "keywords": {
            "conditions": ["includes all", "include one in"],
            "values": {
                "type": "multi-select",
            }
        },
        "year": {
            "conditions": ["=", "<=", ">=", "<", ">"],
            "values": {
                "type": "number",
                "min": 2000,
                "max": 2023
            }
        }
      },
      showValidDocuments: true,  // Initial state for valid documents section
      showInvalidDocuments: false,  // Initial state for invalid documents section
    };
  }

  static contextType = AppContext;

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {
    const endpoint = `get_practical_screen_info?pro_id=${this.context.project['pro_id']}`;
    const method = 'GET';
    const headers = {};
    const body = null;

    this.context.handleApiRequest(endpoint, method, headers, body)
    .then((data) => {
      this.setState({ 
        keywords: data.keywords || [],
        validCsvData: data.references.validDocument || [],
        validFilterWords: data.references.validFilterWords || [],
        invalidCsvData: data.references.invalidDocument || [],
        invalidFilterWords: data.references.invalidFilterWords || []
      });
    })
    .catch((error) => {});

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

  addRule = () => {
    const newRule = {
      logicalOperator: 'AND',
      inexOperator: 'INCLUDE',
      key: Object.keys(this.state.availableFields)[0],
      condition: this.state.availableFields[Object.keys(this.state.availableFields)[0]].conditions[0],
      value: '',
    };

    this.setState((prevState) => ({
      rules: [...prevState.rules, newRule],
    }));
  };

  handleDeleteRule = (index) => {
    this.setState((prevState) => ({
      rules: prevState.rules.filter((_, i) => i !== index),
    }));
  };

  handleChange = (index, field, value) => {
    this.setState((prevState) => {
      const updatedRules = [...prevState.rules];
      updatedRules[index][field] = value;
      return { rules: updatedRules };
    });
  };

  handleFilter = () => {
    const pro_id = this.context.project['pro_id'];
    const endpoint = `filter_references`;
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json'
    };
  
    const body = {
      'pro_id': pro_id,
      'query_filter': this.state.rules
    }

    this.context.handleApiRequest(endpoint, method, headers, body)
    .then((data) => {
      this.setState({ 
        validCsvData: data.references.validDocument || [],
        validFilterWords: data.references.validFilterWords || [],
        invalidCsvData: data.references.invalidDocument || [],
        invalidFilterWords: data.references.invalidFilterWords || []
      });
    })
    .catch((error) => {
    });
  }

  highlightCell = (value, column, filterWords, type) => {

    // Check if the column name exists in validFilterWords
    if (filterWords[column]) {
      const wordsToHighlight = filterWords[column];
      let highlightedValue = value;

      if (highlightedValue) {
        // Iterate through the filter words and highlight them
        wordsToHighlight.forEach((word) => {
          const regex = new RegExp(word, 'gi');
          highlightedValue = highlightedValue.replace(regex, (match) => (
            `<span style="background-color: ${type ? 'red':'yellow'}">${match}</span>`
          ));
        });
      }

      return <span dangerouslySetInnerHTML={{ __html: highlightedValue }} />;
    }

    return value;
  };

  // Function to toggle the visibility of valid documents section
  toggleValidDocuments = () => {
    this.setState((prevState) => ({
      showValidDocuments: !prevState.showValidDocuments,
    }));
  };

  // Function to toggle the visibility of invalid documents section
  toggleInvalidDocuments = () => {
    this.setState((prevState) => ({
      showInvalidDocuments: !prevState.showInvalidDocuments,
    }));
  };

  saveTag = (document, index) => {
    const modalInfo = {
      level: 'update',
      message: `Do you want to update status of this reference?`,
      onYes: () => this.handleUpdateStatus(document, index)
    };
    this.context.handleShowModal(modalInfo);
  }

  handleUpdateStatus = (document, index) => {
    const { validCsvData, invalidCsvData } = this.state;
  
    const list_documents = document ? invalidCsvData : validCsvData;
    const file = list_documents[index];
    const status = file['status'];
    const newStatus = status.includes('screened') ? 'unscreen' : 'screened';

    const pro_id = this.context.project['pro_id'];
    const endpoint = `update_reference`;
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/json'
    };
  
    const body = {
      'pro_id': pro_id,
      'query_filter': this.state.rules,
      'referenceId': file['_id'], 
      'update_type': 'update_status',
      'new_status': newStatus
    }

    this.context.handleApiRequest(endpoint, method, headers, body)
    .then((data) => {
      this.setState((prevState) => {
        const updatedData = document ? [...prevState.invalidCsvData] : [...prevState.validCsvData];
        const updatedFile = { ...updatedData[index] };

        if (status.includes('screened')) {
          updatedFile['status'] = updatedFile['status'].filter((s) => s !== 'screened');
          updatedFile['status'].push('unscreen');
        } else {
          updatedFile['status'] = updatedFile['status'].filter((s) => s !== 'unscreen');
          updatedFile['status'].push('screened');
        }

        updatedData[index] = updatedFile;

        return document ? { invalidCsvData: updatedData } : { validCsvData: updatedData };
      });
      this.context.handleShowNoti({
        level: 'success',
        message: data.message
      });
    })
    .catch((error) => {
    });
  };
  

  render() {
    const { validCsvData, invalidCsvData, sortBy, sortOrder, rules, availableFields, showValidDocuments, showInvalidDocuments, keywords } = this.state;

    const columns = {
        'Title': 'title',
        'Abstract': 'abstract',
        'Authors': 'authors',
        'Published year': 'year',
        'Keywords': 'keywords',
        'Source title': 'source_title',
    };

    // Sort the data based on the selected column and order
    const sortedValidData = [...validCsvData].sort((a, b) => {
        return a['status'].includes('screened') > b['status'].includes('screened') ? -1 : 1;
    });

    const sortedInValidData = [...invalidCsvData].sort((a, b) => {
      return a['status'].includes('screened') > b['status'].includes('screened') ? -1 : 1;
  });

    return (
        <Container fluid>
        <Row>
          <Col sm={12}>
            <Card className='mt-2 mb-4'>
            <Card.Body>
            <div>
                <Button variant="primary" onClick={this.addRule} className="mb-2">
                + Add Rule
                </Button>
                <div className='text-center'>
                {rules.map((rule, index) => (
                <div key={index} className="mb-1">
                    <Form className="text-center">
                    <Row className="justify-content-between">
                        <Col sm={1}>
                        <Form.Group>
                            <Form.Select
                            value={rule.logicalOperator}
                            onChange={(e) => this.handleChange(index, 'logicalOperator', e.target.value)}
                            >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                            </Form.Select>
                        </Form.Group>
                        </Col>
                        <Col  sm={2}>
                        <Form.Group>
                            <Form.Select
                            value={rule.inexOperator}
                            onChange={(e) => this.handleChange(index, 'inexOperator', e.target.value)}
                            >
                            <option value="INCLUDE">INCLUDE</option>
                            <option value="EXCLUDE">EXCLUDE</option>
                            </Form.Select>
                        </Form.Group>
                        </Col>
                        <Col sm={2}>
                        <Form.Group>
                            <Form.Select
                            value={rule.key}
                            onChange={(e) => this.handleChange(index, 'key', e.target.value)}
                            >
                            {Object.keys(availableFields).map((key) => (
                                <option key={key} value={key}>
                                {key}
                                </option>
                            ))}
                            </Form.Select>
                        </Form.Group>
                        </Col>
                        <Col sm={2}>
                        <Form.Group>
                            <Form.Select
                            value={rule.condition}
                            onChange={(e) => this.handleChange(index, 'condition', e.target.value)}
                            >
                            {availableFields[rule.key].conditions.map((condition) => (
                                <option key={condition} value={condition}>
                                {condition}
                                </option>
                            ))}
                            </Form.Select>
                        </Form.Group>
                        </Col>
                        <Col sm={3}>
                        {availableFields[rule.key].values.type === 'number' ? (
                            <Form.Group>
                            <Form.Control
                                type="number"
                                value={rule.value}
                                min={2000}
                                max={2023}
                                required
                                onChange={(e) => this.handleChange(index, 'value', e.target.value)}
                            />
                            </Form.Group>
                        ) : (
                            <Form.Group>
                            <MultiSelect
                                onChange={(selected) => this.handleChange(index, 'value', selected)}
                                options={keywords}
                                required
                                customValue={true}
                                jsonValue={true}
                            />
                            </Form.Group>
                        )}
                        </Col>
                        <Col sm={1}>
                        <Button variant="danger" onClick={() => this.handleDeleteRule(index)}>
                            Delete
                        </Button>
                        </Col>
                    </Row>
                    </Form>
                </div>
                ))}
                <Button variant="secondary" onClick={() => this.handleFilter()} className="mt-2">
                    Filter
                </Button>
                </div>
            </div>
            </Card.Body>
            </Card>
            <div className="mb-1">
              <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                <Button
                  variant="link"
                  className='mb-2'
                  onClick={this.toggleValidDocuments}
                  aria-controls="valid-documents"
                  aria-expanded={showValidDocuments}
                >
                  Matched Documents: {this.state.validCsvData.length} ({showValidDocuments ? 'Hide' : 'Show'})
                </Button>
              </div>
              {
                showValidDocuments ? 
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <Table striped bordered hover>
                    <thead>
                        <tr>
                        <th>ID</th>
                        {Object.keys(columns).map((column, index) => (
                            <th key={index} 
                            // onClick={() => this.handleSort(column)}
                            >
                            {column} 
                            {/* {sortBy === column && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>} */}
                            </th>
                        ))}
                        <th>Screened</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedValidData.map((row, index) => (
                        <tr key={index}>
                            <td>{index+1}</td>
                            {Object.keys(columns).map((key, index) => (
                            <td key={index}>
                              {this.highlightCell(row[columns[key]], columns[key], this.state.validFilterWords, 0)}
                            </td>
                            ))}
                            <td className='text-center'>
                              <Form>
                                <Form.Check
                                  type="checkbox"
                                  defaultChecked={row['status'].includes('screened')}
                                  onChange={() => this.saveTag(0, index)}
                                  style={{ fontSize: '20px', /* other styles as needed */ }}
                                  // Add any additional props or event handlers as needed
                                />
                              </Form>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </Table>
                </div> : <></>
              }
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between'}}>
              <Button
                variant="link"
                className='mb-2'
                onClick={this.toggleInvalidDocuments}
                aria-controls="invalid-documents"
                aria-expanded={showInvalidDocuments}
              >
                Unmatched Documents : {this.state.invalidCsvData.length} ({showInvalidDocuments ? 'Hide' : 'Show'}) 
              </Button>
              </div>
              {
                showInvalidDocuments ? <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <Table striped bordered hover>
                    <thead>
                        <tr>
                        <th>ID</th>
                        {Object.keys(columns).map((column, index) => (
                            <th key={index}>
                            {column}
                            </th>
                        ))}
                        <th>Screened</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedInValidData.map((row, index) => (
                        <tr key={index}>
                            <td>{index+1}</td>
                            {Object.keys(columns).map((key, index) => (
                            <td key={index}>
                              {this.highlightCell(row[columns[key]], columns[key], this.state.invalidFilterWords, 1)}
                            </td>
                            ))}
                            <td className='text-center'>
                              <Form>
                                <Form.Check
                                  type="checkbox"
                                  defaultChecked={row['status'].includes('screened')}
                                  onChange={() => this.saveTag(1, index)}
                                  style={{ fontSize: '20px', /* other styles as needed */ }}
                                  // Add any additional props or event handlers as needed
                                />
                              </Form>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </Table>
                </div> : <></>
              }
          </Col>
        </Row>
      </Container>
    );
  }
}

export default PracticalScreen;
