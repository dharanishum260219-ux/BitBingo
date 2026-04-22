import type { Challenge } from "@/types";

/**
 * The 25 challenges for the BitBingo treasure map (positions 0-24).
 * Position 12 is the center tile: "X Marks the Spot".
 * Used as fallback data when Supabase is not configured.
 */
export const DEMO_CHALLENGES: Challenge[] = [
  { id: 1,  position: 0,  title: "Two Sum",                 description: "Given an array of integers and a target, return indices of the two numbers that add up to the target." },
  { id: 2,  position: 1,  title: "Reverse String",          description: "Write a function that reverses a string in-place without using built-in reverse utilities." },
  { id: 3,  position: 2,  title: "FizzBuzz",                description: 'Print numbers 1–100. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for both print "FizzBuzz".' },
  { id: 4,  position: 3,  title: "Palindrome Check",        description: "Determine whether a given string reads the same forwards and backwards, ignoring case and spaces." },
  { id: 5,  position: 4,  title: "Fibonacci Sequence",      description: "Generate the first N numbers of the Fibonacci sequence using both iterative and recursive approaches." },
  { id: 6,  position: 5,  title: "Binary Search",           description: "Implement binary search on a sorted array and return the index of the target element, or -1 if not found." },
  { id: 7,  position: 6,  title: "Bubble Sort",             description: "Sort an array of integers using the bubble sort algorithm and explain its time complexity." },
  { id: 8,  position: 7,  title: "Stack Implementation",    description: "Implement a Stack class with push, pop, peek, and isEmpty operations using an array as the underlying structure." },
  { id: 9,  position: 8,  title: "Queue Implementation",    description: "Implement a Queue class with enqueue, dequeue, front, and isEmpty operations using a linked-list approach." },
  { id: 10, position: 9,  title: "Anagram Check",           description: "Given two strings, determine whether they are anagrams of each other (same characters, different order)." },
  { id: 11, position: 10, title: "Linked List Reversal",    description: "Reverse a singly linked list in-place and return the new head node." },
  { id: 12, position: 11, title: "Valid Parentheses",       description: 'Given a string containing only brackets "()", "[]", "{}", check if the bracket sequence is valid and balanced.' },
  { id: 13, position: 12, title: "X Marks the Spot",        description: "Implement a circle printing logic based on coordinate geometry. Given radius r, print all integer (x, y) pairs that satisfy x² + y² ≤ r², centered at the origin." },
  { id: 14, position: 13, title: "Matrix Rotation",         description: "Rotate an N×N matrix 90 degrees clockwise in-place without using extra matrix space." },
  { id: 15, position: 14, title: "Hash Map from Scratch",   description: "Build a simple hash map with set, get, and delete methods using an array of buckets and a hash function." },
  { id: 16, position: 15, title: "String Compression",      description: 'Implement basic string compression: "aaabbc" → "a3b2c1". Return the original string if compression does not shrink it.' },
  { id: 17, position: 16, title: "Merge Sort",              description: "Sort an array using the merge sort algorithm. Demonstrate the divide, conquer, and merge phases clearly." },
  { id: 18, position: 17, title: "Tree In-order Traversal", description: "Perform in-order traversal of a binary search tree and return the nodes in sorted ascending order." },
  { id: 19, position: 18, title: "Graph BFS",               description: "Implement Breadth-First Search on an adjacency-list graph and return the traversal order from a given start node." },
  { id: 20, position: 19, title: "Graph DFS",               description: "Implement Depth-First Search on an adjacency-list graph both iteratively (using a stack) and recursively." },
  { id: 21, position: 20, title: "Power of Two",            description: "Determine whether a given integer is a power of two using bitwise operations (no loops or recursion)." },
  { id: 22, position: 21, title: "Coin Change",             description: "Given coin denominations and a target amount, find the minimum number of coins needed to make up that amount." },
  { id: 23, position: 22, title: "Longest Common Subseq.",  description: "Find the length of the longest common subsequence between two strings using dynamic programming." },
  { id: 24, position: 23, title: "Regex: Count Vowels",     description: "Use regular expressions to count the total number of vowels in a given paragraph of text." },
  { id: 25, position: 24, title: "Quick Sort",              description: "Sort an array using the quick sort algorithm with a pivot strategy of your choice. Discuss average vs worst-case." },
];
