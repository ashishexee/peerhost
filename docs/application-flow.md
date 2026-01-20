1. the user will come to the app for the first time
2. we will ask the user to connect their wallet to the app
3. in the second screen the user will be able to all the workers already linked to 
their account
4. if the user has no workers already linked then show add a workers
5. if the user already has workers then give the user option to use the exiting workers and we will take the user to the main screen
6. but if the user choose to use a new workers then we will take them to add workers page
7. in the add workers page, we will generate a burned workers address and then register this workers address to the users main address as in the contract executionCoordinator.sol after the user has sucessfully registed the workers to their account then we will take them to the main screen
8. when going to the main screen we will check the balance of amoy testnet of the worker if its zero then we will ask the user to add some funds in order to bear the gas fee
9. then we will ask the user how much amount to transfer then the user will tranfer the funds and then we will take the user to the main screen

10. make the main screen or the home screen a white scaffold for now we will come to it later 


#fix 01 fixed
if the user has connected the wallet from the first screen make sure to save that in the shared preference when the next time user opens the app make sure to check the shared preference and see if the user has saved or not and then proceed to the next screen 


#fix 02 for the import key
the user will come to the application and see all their workers address made if they want to choose a worker that is not their last used workers then they will have to 
enter the private key and verify the worker
we will save this private key and the account address in a map of Sharedpreference
also when the user creates a new worker we will show the worker the private key as well as the account number and strictly ask the user to copy this workers key somewhere safe and also say that even if this account is compromised you wont loose your main wallet but the gas fund in this account will be gone
okay?
ask me again if you donot understand anything donot assume anything
