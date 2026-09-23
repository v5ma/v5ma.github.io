# Complementary granularity can preserve an exact relation

Let the earlier value x and later value y belong to {0,1,2,3}, restricted to the eight ordered neighbor pairs for which (y-x) mod 4 is 1 or 3. Let c=floor(x/2) be the coarse earlier value, and let d be the binary clockwise/counterclockwise label. This is a finite explanatory witness, not a physiological phase model, a new general theorem or an additional Lean compilation.

Because x and y have opposite parity on this domain, knowing c and the fine later value y determines x exactly:

`x = 2c + 1 - (y mod 2)`.

The right side belongs to the coarse bin {2c,2c+1} and has parity opposite to y, so it is the unique permitted earlier value in that bin. The correct direction d then follows from (y-x) mod 4. The mixed code uses one coarse bit and two fine bits, instead of two nominal fine bits for each component. That comparison concerns source category widths; the constrained fine-pair domain itself has only eight possibilities and therefore three bits of entropy under a uniform distribution.

| x | y | coarse x | (y-x) mod 4 |
| ---: | ---: | ---: | ---: |
| 0 | 1 | 0 | 1 |
| 0 | 3 | 0 | 3 |
| 1 | 2 | 0 | 1 |
| 1 | 0 | 0 | 3 |
| 2 | 3 | 1 | 1 |
| 2 | 1 | 1 | 3 |
| 3 | 0 | 1 | 1 |
| 3 | 2 | 1 | 3 |

Each mixed pair (coarse x, y) occurs once. By contrast, observing x alone, y alone, the unordered pair {x,y}, or the two coarse bins leaves both direction labels equally represented. Their best possible label accuracy is one half under the declared uniform distribution. A fine earlier value with a coarse later value is also sufficient by the symmetric parity argument. These facts are exhaustively checked for every complete background block in all declared splits by the current audit.

The learned mixed policy is not given this reconstruction formula as its response rule. It acquires query branches and response distributions from labeled examples. Its ability to use the relation still depends on having encountered the required earlier coarse information. This connects the paper's composition and granularity distinctions without claiming that more fine detail is always needed, that a code's nominal width equals information, or that the finite example identifies a biological rendering.
