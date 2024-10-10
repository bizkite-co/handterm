# Prompt Instructions

* Include background on why each React best practice is chosen and why it might be important.
* Suggest AWS CLI and other commands rather than using a GUI. 
* Use an `rm path/to/file` command to remove files, rather than attempts at diffing, which are very unreliable.
* Use the principle of "first, do no harm". Avoid additional changes that are likely to cause problems.
* Use the principle of "least touching". Attempt to limit changes to only the things that are necessary to solve the problem.
* Avoid "churning", going back and forth on changes quickly. Unless your change is flagged in your mind as "experimental" and purely for discovery of conditions, you are probably making a directed change for a longer range intent. Keep the intent in mind and in the context of what you are doing in the current change. 

## Product Specification

A TUI interface for learning to use a specialized keyboard through typing practice and games.
