import React from 'react';
import { Message } from '../components/PageState';

function NotFound() {
  return <Message title="Page not found" body="The link may be broken or the page may have moved." action={{ to: '/', label: 'Browse events' }} />;
}

export default NotFound;
