# ADAMS-Coin
If "42" is the answer to the “ultimate question of life, the universe, and everything,
then perhaps the question is "what random and unexpected thing will happen to me today?".
In the spirit of Life, The Universe and Everything, here is Adams coin.

Each token transfer is taxed 42% and then that tax is randomly given to one account holder.
The more you hold and the longer you hold, the greater your chance of tax windfalls is.
Tax distribution is done according to these rules

1. The contract owner can never win
2. 10 % of the time, there is a non-weighted distribution. Meaning each wallet has an equal chance of winning, regardless of their token balance. This is done to increase the randomness and help out new account holders. In the case of weighted distribution, it's possible whales will almost always win, thus exponentially increasing their chance of future winning. I don't actually know if 10% is the right percentage to allocate to this chance, it would be worth experimenting some.
3. 90% of the time there is a weighted distribution. Each token owned increases your chance of winning.  

Now, I don't actually think this contract would be accepted by DEXes due to how I've implemented taxing on transfers. That said, it was a fun coding exercise and a fun thought experiment of how to create tokenomics that would appeal to people's love of mild gambling.
