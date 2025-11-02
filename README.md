# Pizza Problem

This technical assessment problem involves determining how much pizza oven capacity is being used in any given 10-minute window over a time-series.

The most basic first version of this problem does not worry about:

- Available capacity of the pizza ovens. Just how much capacity is being used total. (if 2 pizzas cook simultaneously for 10 minutes, that counts as 20 minutes of usage, 4 for 40 minutes, and so on)
- Calculating when orders will be ready.
- Calculating the timeline, this is pre-calculated and provided as input data. Though it may be better to dynamically populate this from items as they are added as opposed to hard-coded.

The last version of the solution DOES include these additional features.

## Files:

- `original.ts` contains the original problem to be solved
- `/iterations` folder contains various iterations of the solution as I worked through the problem and refined my approach.

## Usage

- You'll need Node.js installed to run the code. 

- Run `npm install` in the repo root to install the dependencies.

- In the `package.json`, you can run each of the solution iterations to see their output. For example:

```bash
npm run iter1
```
