import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AppContext from '../AppContext';

class TestPage extends React.Component {
  constructor(props) {
    super(props);
  }

  static contextType = AppContext

  componentDidMount() {
  }

  render() {
    return (
      <div>
        <Row>
          <Col sm={12} className="mt-4">
            <div className="text-center">
              <h1 className="font-weight-bold">AI-powered tool for Literature Review</h1>
              <p className="lead">
                Welcome to our AI-powered chatbot designed to assist you in your literature review process.
              </p>
            </div>
            <div style={{paddingLeft: '25%'}}>
              <div className="text-left">
                <p className="font-weight-bold">Next Steps to Follow:</p>
                <ol>
                  <li>
                    Initiation
                    <ul>
                      <li>Research topics</li>
                      <li>Research objectives</li>
                      <li>Research questions</li>
                      <li>Research sub-questions</li>
                      <li>Research keywords</li>
                      <li>Quality assessment questions</li>
                    </ul>
                  </li>
                  <li>
                    Import References
                  </li>
                  <li>
                    Practical Screening:
                    <ul>
                      <li>Set rules to filter valid articles</li>
                      <li>Remove duplicate articles</li>
                    </ul>
                  </li>
                  <li>
                    Full-text Screening:
                    <ul>
                      <li>Upload full-text PDF files</li>
                      <li>Use the chatbot to respond to quality assessment questions</li>
                    </ul>
                  </li>
                  <li>
                    Data Extraction:
                    <ul>
                      <li>Use the chatbot to respond to sub-research questions</li>
                      <li>Export extracted data</li>
                    </ul>
                  </li>
                  <li>
                    Synthesis:
                    <ul>
                      <li>Use the synthesized information to write paper sections</li>
                      <li>Export the results</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>
            <div className="flex text-center">
              <Link to="/projects">
                <Button variant="primary" style={{marginRight: '5px'}}>New</Button>
              </Link>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}

export default TestPage;