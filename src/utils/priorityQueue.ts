class QElement<E> {
  priority: number;
  element: E;

  constructor(element: E, priority: number) {
    this.element = element;
    this.priority = priority;
  }
}

class PriorityQueue<E> {
  items: QElement<E>[];

  constructor() {
    this.items = [];
  }

  enqueue(element: E, priority: number) {
    const qElement = new QElement(element, priority);
    let contain = false;

    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority > qElement.priority) {
        this.items.splice(i, 0, qElement);
        contain = true;
        break;
      }
    }

    if (!contain) {
      this.items.push(qElement);
    }
  }

  dequeue() {
    if (this.isEmpty()) return "Underflow";
    return this.items.shift();
  }

  front() {
    if (this.isEmpty()) return "No elements in Queue";
    return this.items[0];
  }

  rear() {
    if (this.isEmpty()) return "No elements in Queue";
    return this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length == 0;
  }

  listQueue() {
    const list = [];
    for (let i = 0; i < this.items.length; i++)
      list.push(this.items[i].element);
    return list;
  }
}

export { PriorityQueue };
