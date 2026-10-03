import { EventEmitter } from 'events';

class EventBus extends EventEmitter {}

const bus = new EventBus();

export default bus;
