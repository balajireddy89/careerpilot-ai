/** Instant fallback MCQs when AI is slow or unavailable */

const JAVA = [
  { q: 'Which class is the superclass of every class in Java?', options: ['String', 'Object', 'Class', 'System'], a: 'Object' },
  { q: 'Which keyword prevents a class from being subclassed?', options: ['static', 'final', 'abstract', 'private'], a: 'final' },
  { q: 'What is the default value of a boolean instance variable?', options: ['true', 'false', 'null', '0'], a: 'false' },
  { q: 'Which collection does not allow duplicate elements?', options: ['List', 'Set', 'Map', 'Queue'], a: 'Set' },
  { q: 'Which interface must a class implement to be used in a for-each loop as iterable?', options: ['Runnable', 'Serializable', 'Iterable', 'Comparator'], a: 'Iterable' },
  { q: 'Which keyword is used for exception handling?', options: ['throw', 'throws', 'try', 'All of these'], a: 'All of these' },
  { q: 'What is JVM?', options: ['Java Variable Machine', 'Java Virtual Machine', 'Java Verified Module', 'Joint Virtual Memory'], a: 'Java Virtual Machine' },
  { q: 'Which access modifier allows visibility within the same package only?', options: ['private', 'protected', 'default (package-private)', 'public'], a: 'default (package-private)' },
  { q: 'Which method is the entry point of a Java application?', options: ['start()', 'run()', 'main()', 'init()'], a: 'main()' },
  { q: 'Which OOP principle hides internal state?', options: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'], a: 'Encapsulation' },
];

const DATABASES = [
  { q: 'Which SQL clause filters rows before grouping?', options: ['WHERE', 'HAVING', 'ORDER BY', 'GROUP BY'], a: 'WHERE' },
  { q: 'Which key uniquely identifies each row in a table?', options: ['FOREIGN KEY', 'PRIMARY KEY', 'UNIQUE', 'CHECK'], a: 'PRIMARY KEY' },
  { q: 'Which normal form removes partial dependency on a composite key?', options: ['1NF', '2NF', '3NF', 'BCNF'], a: '2NF' },
  { q: 'ACID in databases stands for Atomicity, Consistency, Isolation, and ___', options: ['Integrity', 'Durability', 'Indexing', 'Distribution'], a: 'Durability' },
  { q: 'Which JOIN returns matching rows from both tables only?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN'], a: 'INNER JOIN' },
  { q: 'MongoDB is an example of what type of database?', options: ['Relational', 'Document NoSQL', 'Graph', 'Time-series'], a: 'Document NoSQL' },
  { q: 'Which command removes all rows but keeps table structure?', options: ['DROP', 'DELETE', 'TRUNCATE', 'REMOVE'], a: 'TRUNCATE' },
  { q: 'An index on a column primarily improves ___', options: ['insert speed', 'read/query speed', 'storage size', 'backup time'], a: 'read/query speed' },
  { q: 'Which constraint links a child table to a parent table?', options: ['PRIMARY KEY', 'FOREIGN KEY', 'NOT NULL', 'DEFAULT'], a: 'FOREIGN KEY' },
  { q: 'Which SQL command modifies existing rows?', options: ['INSERT', 'UPDATE', 'ALTER', 'CREATE'], a: 'UPDATE' },
];

const DSA = [
  { q: 'Time complexity of binary search on a sorted array?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], a: 'O(log n)' },
  { q: 'Which data structure uses FIFO?', options: ['Stack', 'Queue', 'Tree', 'Heap'], a: 'Queue' },
  { q: 'Worst-case time complexity of Quick Sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], a: 'O(n²)' },
  { q: 'A balanced BST search operation is typically ___', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], a: 'O(log n)' },
  { q: 'Which structure is best for LRU cache implementation?', options: ['Array', 'HashMap + Doubly Linked List', 'Stack', 'Queue'], a: 'HashMap + Doubly Linked List' },
  { q: 'Dijkstra algorithm finds shortest paths in graphs with ___', options: ['negative weights', 'non-negative weights', 'cycles only', 'trees only'], a: 'non-negative weights' },
  { q: 'Merge Sort space complexity is ___', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], a: 'O(n)' },
  { q: 'Hash table average lookup time with good hashing is ___', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], a: 'O(1)' },
  { q: 'Which traversal gives sorted order in a BST?', options: ['Preorder', 'Inorder', 'Postorder', 'Level order'], a: 'Inorder' },
  { q: 'Dynamic programming is used when problems have ___', options: ['greedy choice only', 'overlapping subproblems', 'no optimal substructure', 'fixed input size'], a: 'overlapping subproblems' },
];

const PYTHON = [
  { q: 'Which keyword defines a function in Python?', options: ['func', 'def', 'function', 'fn'], a: 'def' },
  { q: 'Python lists are ___', options: ['immutable', 'mutable', 'fixed-size arrays', 'hash maps'], a: 'mutable' },
  { q: 'Which type is used for key-value pairs?', options: ['list', 'tuple', 'dict', 'set'], a: 'dict' },
  { q: 'What does len([1,2,3]) return?', options: ['2', '3', '4', 'Error'], a: '3' },
  { q: 'Which keyword handles exceptions?', options: ['catch', 'try/except', 'handle', 'error'], a: 'try/except' },
  { q: 'List comprehension syntax is written inside ___', options: ['parentheses', 'square brackets', 'curly braces', 'angle brackets'], a: 'square brackets' },
  { q: 'None in Python is similar to ___ in other languages', options: ['0', 'false', 'null', 'undefined only in JS'], a: 'null' },
  { q: 'Which module is commonly used for data frames?', options: ['numpy', 'pandas', 'requests', 'flask'], a: 'pandas' },
  { q: 'Indentation in Python is used for ___', options: ['comments', 'code blocks', 'strings', 'imports'], a: 'code blocks' },
  { q: 'Which operator checks identity not equality?', options: ['==', 'is', '=', '==='], a: 'is' },
];

const JAVASCRIPT = [
  { q: 'typeof null in JavaScript returns ___', options: ['"null"', '"object"', '"undefined"', '"number"'], a: '"object"' },
  { q: 'const declares a variable with ___', options: ['function scope only', 'block scope', 'global scope only', 'no scope'], a: 'block scope' },
  { q: 'Which method adds an element to the end of an array?', options: ['push', 'pop', 'shift', 'unshift'], a: 'push' },
  { q: '=== operator checks ___', options: ['value only', 'value and type', 'reference only', 'truthiness'], a: 'value and type' },
  { q: 'Promises are used for ___', options: ['styling', 'async operations', 'DOM selection', 'type checking'], a: 'async operations' },
  { q: 'JSON.parse converts a string to a ___', options: ['string', 'JavaScript value/object', 'array only', 'function'], a: 'JavaScript value/object' },
  { q: 'Arrow functions do not have their own ___', options: ['parameters', 'this binding', 'return', 'name'], a: 'this binding' },
  { q: 'Which loop iterates object enumerable properties?', options: ['for...of', 'for...in', 'while', 'do...while'], a: 'for...in' },
  { q: 'Event bubbling means events propagate from ___', options: ['window to target', 'target to ancestors', 'sibling to sibling', 'none'], a: 'target to ancestors' },
  { q: 'localStorage data persists until ___', options: ['tab close only', 'explicitly cleared', 'page refresh', '1 hour'], a: 'explicitly cleared' },
];

const GENERIC = [
  { q: 'REST APIs commonly use HTTP method GET for ___', options: ['creating resources', 'reading resources', 'deleting only', 'authentication only'], a: 'reading resources' },
  { q: 'Git command to create a new branch?', options: ['git branch -m', 'git checkout -b', 'git push origin', 'git clone'], a: 'git checkout -b' },
  { q: 'Docker packages an app with its dependencies into a ___', options: ['virtual machine', 'container', 'kernel', 'registry only'], a: 'container' },
  { q: 'HTTPS primarily provides ___', options: ['compression', 'encryption', 'caching', 'load balancing'], a: 'encryption' },
  { q: 'CI/CD automates build, test, and ___', options: ['design', 'deployment', 'marketing', 'billing'], a: 'deployment' },
  { q: 'Load balancers distribute traffic across ___', options: ['users', 'multiple servers', 'databases only', 'clients'], a: 'multiple servers' },
  { q: 'Unit tests verify ___', options: ['entire user flows', 'individual components', 'UI pixels', 'network latency'], a: 'individual components' },
  { q: 'TCP is a ___ layer protocol', options: ['application', 'transport', 'physical', 'presentation'], a: 'transport' },
  { q: 'Agile emphasizes ___ development', options: ['waterfall', 'iterative', 'documentation-only', 'fixed scope'], a: 'iterative' },
  { q: 'Cloud IaaS provides virtualized ___', options: ['applications only', 'compute/storage/network', 'IDEs', 'databases only'], a: 'compute/storage/network' },
];

export const FALLBACK_MCQ_BY_TOPIC = {
  Java: JAVA,
  Python: PYTHON,
  JavaScript: JAVASCRIPT,
  'Databases & SQL': DATABASES,
  'Data Structures & Algorithms': DSA,
  'Operating Systems': GENERIC,
  'Computer Networks': GENERIC,
  'System Design': GENERIC,
  'Web Development': JAVASCRIPT,
  'DevOps & Cloud': GENERIC,
  'Machine Learning': GENERIC,
  'C++': DSA,
};

export function getFallbackQuestions(topic, count = 10) {
  const pool = FALLBACK_MCQ_BY_TOPIC[topic] || GENERIC;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q, i) => ({ ...q, id: `fb-${topic}-${i}` }));
}
