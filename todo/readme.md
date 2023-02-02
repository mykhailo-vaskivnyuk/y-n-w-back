# APP FUNCTIONS

- disconnect on inactive period
- disconnect on facilitator absence

---

# BACK

## ARCHITECTURE

## DB

- order db types
- create additional indexes
- create DB check algorithm and procedure
- use `UPSERT` to write `sessions`
- optimize texts of queries, select identical parts, move them to separate file
- remove `RETURNING` if unnecessary and add its if necessary
- ? verify types of queries' results, use `::type` operator

## ENDPOINTS

- combine `getMemberStatus()` on backend with `app.member.getStatus()` on frontend
- add metadata `handler.allowedForNetUser` and error type `HandlerError('FORBIDDEN')`

## CONNECTION

- check `Websocket connection` is alive

## OTHER

1. sync back api schemas with front (e.g. forms validation)
2. logger colorize only in pretty mode
3. db - search field indexes
4. logger error params
5. endpoints in try catch
6. ws session finalize, if error?
7. arrange routes and db queries by names
8. ws request params log similar to http request log
9. rename operationData operationDataHandler/s operationAnswer operationAnswerHandler/s requestHndler/s responseHandler/s
10. applyHandlers combine with createHandlers
11. divide sync into different modes: back-front, front- back, bidirectional; remove files before copy, run script in app afte creating routs
12. languages support
13. req/res log to different module
14. try combine net.create with net.createChild
15. first_net_id rename to root_net_id, for nodes do the same
16. test enter root, ente net, change to another net serial, change to another in step, leave root net, leave child net, comeout, reload in all modes
17. create tree in a query
18. implement 'net not found' case
19. outputValidation error - 500, not 400
20. session clear delete from db
21. видалення спільноти
22. enter on wrong token
23. log errors into db
24. enter over token when being in an account
25. user net to net
26. operationPrepareHandlares, operationResultHandlers, move to special dir
27. users_nets_nodes
28. readUser - remove net from session or clear session
29. users_nodes_invites
30. refactor net router and net enter and net comeout add control on back for netid and nodeid depends on user status, refactor redirect
31. CONNECTED is not net user
32. add level limit 6 and net limit
33. refactor net menu
34. save to session nets, or work as app and add tree, circle
35. notifications, reorganization, remove on time limit and vote
36. empty node if count === 0, can invite if empty
37. findUserNet -> userNet
38. check schema and paramsSchema fields of endpoint
39. check tighten if userId isnull
40. combine confirm and restore tokens, add index

---

# FRONT

## APP

## UI

- create `<IconMenuItem />`

## ROUTING

- set `netView` correctly
- control routes access in acсordance with `user_state`

## OTHER

1. env, config service (IS_DEV)
2. loginOrSignup type parameters
3. messege befor account deletion and network leaving
4. full window
5. AppState remove enum
6. rename state to status
7. app.init, read pathname to init app state
8. all texts in one place
9. if uset_status has changed - emit user
10. simplify redirect
11. hide main menu if in net
12. user/net - net/
13. net menu спільноту назавжди - спільноту, parents into orange
14. get parents net menu items by requesion
15. horizontal view
16. if 503 do not show 404 page /net/5
17. start, run dev, login (not refresh) - only service not available, not wrong credentials
18. redirect use to get state
19. repair net not found
20. dynamic import?
21. create common member component
22. useRedirect
23. /#xxxx ?
24. showMessage move outside
25. setNetView on tree/circle routes
26. do INVITED user UI
27. redirect replace: true
28. copy button for invite
29. decide how to determine vote button display

---

# TESTING