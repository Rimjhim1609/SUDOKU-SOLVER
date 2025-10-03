#include <iostream>
#include <vector>
using namespace std;

bool isValid(vector<vector<int>>& board, int row, int col, int val) {
    for(int i=0; i<9; i++)
        if(board[row][i] == val || board[i][col] == val)
            return false;
    int br = (row/3)*3, bc = (col/3)*3;
    for(int i=br; i<br+3; i++)
        for(int j=bc; j<bc+3; j++)
            if(board[i][j] == val)
                return false;
    return true;
}

bool sudokuSolve(vector<vector<int>>& board) {
    for(int r=0; r<9; r++)
        for(int c=0; c<9; c++)
            if(board[r][c] == 0) {
                for(int v=1; v<=9; v++) {
                    if(isValid(board, r, c, v)) {
                        board[r][c] = v;
                        if(sudokuSolve(board)) return true;
                        board[r][c]=0;
                    }
                }
                return false;
            }
    return true;
}

void printBoard(const vector<vector<int>>& board) {
    for(const auto& row : board) {
        for(int v : row)
            cout << (v ? v : 0) << " ";
        cout << endl;
    }
}

int main() {
    vector<vector<int>> puzzle = {
        {0,6,0,1,0,5,0,2,0},
        {0,0,0,0,6,0,0,0,7},
        {0,0,7,0,0,8,6,0,0},
        {8,0,2,0,0,0,3,0,0},
        {0,0,0,0,0,0,0,0,0},
        {0,0,0,0,0,0,0,0,4},
        {0,0,8,7,0,0,0,0,0},
        {0,4,0,0,0,0,0,0,0},
        {0,1,0,0,9,0,0,7,0}
    };
    if(sudokuSolve(puzzle)) {
        cout << "Solved Sudoku:\n";
        printBoard(puzzle);
    } else {
        cout << "Unsolvable puzzle\n";
    }
    return 0;
}
