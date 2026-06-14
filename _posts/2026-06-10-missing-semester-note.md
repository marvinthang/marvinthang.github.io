---
title: "Missing Semester Notes"
date: 2026-06-10 10:00:00 +0800
categories: [tools]
tags: [linux, shell, bash, git, debugging, profiling, ssh, tmux, dotfiles, developer-tools, missing-semester]
description: "Compact personal notes from the Missing Semester course on shell usage, Git, debugging, profiling, SSH, tmux, dotfiles, and developer tooling."
---

## Command-line Environment

### Arguments, flags, and streams

Shell arguments are strings.

```bash
$0   # script/program name
$1   # first arg
$2   # second arg
$@   # all args
$#   # number of args
```

Flags are conventions: `--` for long flags, `-` for short flags. A bare `--` means end of flags.

```bash
ls -la
ls -l -a
ls --all
ls -- -file.txt   # arg is "-file.txt", not a flag
```

`-` often means read from stdin:

```bash
echo "hello" | grep "hello" -
```

### Redirection

```bash
cmd > out.txt          # stdout overwrite
cmd >> out.txt         # stdout append
cmd 2> err.txt         # stderr
cmd &> all.txt         # stdout + stderr
cmd < input.txt        # stdin from file
cmd > /dev/null 2>&1   # discard stdout + stderr
```

### Variables and substitution

```bash
foo=bar
echo "$foo"     # expands variable
echo '$foo'     # literal string
files=$(ls)     # command substitution
diff <(ls src) <(ls docs)  # process substitution
```

Environment variable for one command:

```bash
TZ=Asia/Tokyo date
```

Export or delete variables:

```bash
export DEBUG=1
bash -c 'echo "$DEBUG"'
unset DEBUG
```

### Return codes

```bash
echo $?
```

`if` checks return code:

```bash
if grep -q "pattern" file.txt; then
    echo "Found"
fi
```

### Signals and jobs

```txt
Ctrl-C  -> SIGINT   interrupt
Ctrl-\  -> SIGQUIT  quit
Ctrl-Z  -> SIGTSTP  suspend
```

```bash
jobs          # list jobs
fg            # bring job to foreground
bg            # continue suspended job in background
kill PID
kill -TERM PID
kill -KILL PID
kill -l       # list signals
echo $!       # last background process PID
```

Background jobs may die when the terminal closes because of `SIGHUP`. Avoid that with:

```bash
nohup long_command &
disown
```

`SIGHUP` originally meant terminal hangup. Now it often means the controlling terminal/session went away. Default action: terminate, but programs can catch or ignore it.

```bash
nohup cmd &        # run cmd ignoring SIGHUP
kill -SIGHUP PID   # manually send SIGHUP
```

Script cleanup:

```bash
cleanup() {
    rm -f /tmp/mytemp.*
}

trap cleanup EXIT
trap cleanup SIGINT SIGTERM
```

### SSH

```bash
ssh user@server
ssh user@server ls | wc -l       # ls remote, wc local
ssh user@server 'ls | wc -l'     # both remote
```

```bash
ssh-keygen -a 100 -t ed25519 -f ~/.ssh/id_ed25519
ssh-copy-id -i ~/.ssh/id_ed25519 user@server
scp local_file user@server:/path/to/remote_file
rsync -avP local_dir/ user@server:/path/to/remote_dir/
```

`~/.ssh/config`:

```sshconfig
Host vm
    User alice
    HostName 172.16.174.141
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
```

Then:

```bash
ssh vm
```

### tmux

```bash
tmux
tmux new -s NAME
tmux ls
tmux a
tmux a -t NAME
```

Prefix = `Ctrl-b`.

```txt
Ctrl-b d       detach
Ctrl-b c       new window
Ctrl-b n       next window
Ctrl-b p       previous window
Ctrl-b ,       rename window
Ctrl-b w       list windows
Ctrl-b "       horizontal split
Ctrl-b %       vertical split
Ctrl-b arrows  move pane
Ctrl-b z       zoom pane
Ctrl-b [       scrollback mode
```

Use tmux on remote servers so jobs survive disconnects.

### Dotfiles and PATH

Common config files:

```txt
~/.bashrc
~/.bash_profile
~/.gitconfig
~/.vimrc
~/.ssh/config
~/.tmux.conf
```

```bash
export PATH="$PATH:/path/to/bin"
```

Dotfiles should ideally be in a Git repo and symlinked into place.

### Install scripts, tools, aliases, history

Avoid blindly doing:

```bash
curl URL | bash
```

Safer:

```bash
curl -fsSL URL -o install.sh
less install.sh
bash install.sh
```

Useful tools:

```bash
rg      # better grep
fd      # better find
fzf     # fuzzy finder
tldr    # short example-based man pages
```

```bash
ls | fzf
cat ~/.bash_history | fzf
tldr fd
```

Aliases:

```bash
alias ll="ls -lh"
alias la="ls -A"
alias gs="git status"
alias gc="git commit"
alias mkdir="mkdir -p"
alias df="df -h"
```

```bash
\ls        # bypass alias
unalias ll
alias ll    # check alias
```

If an alias needs arguments in the middle, use a shell function instead.

```txt
Ctrl-R = reverse search shell history
```

With fzf integration, `Ctrl-R` becomes fuzzy history search.

## Vim

### Movement

- `e` - end of word
- `0` - start of line
- `^` - first non-blank character
- `$` - end of line
- `gg` - start of file
- `G` - end of file
- `:123` - go to line 123
- `%` - jump between matching parentheses/brackets/braces

Find character on current line:

```txt
f<char>  find forward to char
t<char>  find forward till before char
F<char>  find backward to char
T<char>  find backward till after char
;        repeat last f/t/F/T
,        repeat in opposite direction
```

### Text objects and comments

```txt
ci(   change inside parentheses
ci[   change inside brackets
ci{   change inside braces
da'   delete around single quotes
c$    change to end of line
```

LazyVim:

```txt
gcc       toggle comment on current line
V + gc    toggle comment on visual selection
gcap      toggle comment on current paragraph
```

## Debugging

### Logging and system logs

Print debugging starts with:

```bash
echo "x = $x"
```

For real programs, prefer logs with severity, context, timestamps, and structured output when possible.

Verbose flags:

```bash
cmd -v
cmd --verbose
cmd -vvv
```

System logs:

```bash
journalctl -u <service>
journalctl -xe
ls /var/log
```

### `gdb`

Use a debugger when prints are unclear, the bug is hard to reproduce, restarting is expensive, or crash state matters.

```bash
gdb ./program
gdb -tui ./program
```

Useful commands:

```gdb
run             # start program
b main          # breakpoint at function
b file.cpp:42   # breakpoint at line
c               # continue
step            # step into
next            # step over
finish          # step out
p variable      # print variable
bt              # backtrace / call stack
watch expr      # stop when expr changes
Ctrl-x a        # toggle TUI inside gdb
```

Compile with debug symbols and better stack traces:

```bash
gcc -g program.c -o program
g++ -g main.cpp -o main
-g -fno-omit-frame-pointer
```

### `rr`

`rr` records one execution and replays it deterministically. Useful for flaky tests, crashes, memory corruption, and reverse debugging.

```bash
rr record ./program
rr replay
```

```gdb
reverse-continue/rc    # run backward until breakpoint/watchpoint
reverse-step/rs        # step backward into
reverse-next/rn        # step backward over
reverse-finish/rf      # run backward until this function was called
```

Workflow:

```txt
1. Run until crash/corruption.
2. Inspect bad state.
3. Set watchpoint on corrupted variable.
4. reverse-continue to find who wrote it.
```

`rr` works best on Linux, may require hardware performance counters, and may not work well in some VMs/cloud machines.

### `strace`, `bpftrace`, and network debugging

`strace` shows how a program talks to the OS.

```bash
strace ./program
strace -e trace=file ./program
strace -f ./program
strace -p <PID>
strace -T ./program
```

Useful questions:

```txt
Why is this program hanging?
What file is it trying to open?
What permission/path is wrong?
Is it repeatedly calling some syscall?
```

`bpftrace` is lower-overhead and can trace kernel/system events and aggregate results.

```bash
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_* { @[probe] = count(); }'
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_* /comm == "bash"/ { @[probe] = count(); }'
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_* /pid == cpid/ { @[probe] = count(); }' -c 'ls -la'
```

Use `strace` first. Use `bpftrace` for lower overhead, kernel tracing, or aggregation.

Network debugging:

```bash
sudo tcpdump -i any port 80
sudo tcpdump -i any -w capture.pcap
ss -tlnp | grep :8080
```

For HTTPS, packet capture cannot directly show decrypted data. Use browser devtools Network tab, mitmproxy, or Wireshark with proper keys/config.

### Memory debugging

Memory bugs:

```txt
buffer overflow
use-after-free
use-after-return
memory leak
uninitialized read
undefined behavior
data race
```

Sanitizers require recompilation but are fast enough for regular development/CI.

```bash
gcc -fsanitize=address -g program.c -o program
./program

g++ -fsanitize=address -g main.cpp -o main
./main
```

```bash
-fsanitize=address      # ASan: buffer overflow, use-after-free, leaks
-fsanitize=undefined    # UBSan: undefined behavior
-fsanitize=thread       # TSan: data races
-fsanitize=memory       # MSan: uninitialized memory, usually with Clang
-g -O1 -fsanitize=address,undefined -fno-omit-frame-pointer
```

Use Valgrind when you cannot recompile, do not have source, or need tools not covered by sanitizers.

```bash
valgrind --leak-check=full ./program
```

Valgrind is slower than sanitizers.

### AI for debugging

Useful for explaining compiler errors, stack traces, sanitizer reports, places to inspect, and cross-language/build-system issues.

But:

```txt
LLMs can hallucinate.
Always verify with actual tools.
Do not blindly accept fixes.
Use tests/debuggers/profilers to confirm.
```

Good prompt style:

```txt
Here is the error + relevant code + what I expected.
Explain likely root cause and suggest how to verify it.
```

## Profiling

### Workflow and timing

```txt
1. Measure first.
2. Find bottleneck.
3. Optimize the bottleneck.
4. Measure again.
```

Do not optimize random code based on vibes.

```bash
time ./program
time curl https://missing.csail.mit.edu &> /dev/null
```

```txt
real = wall-clock elapsed time
user = CPU time spent in user code
sys  = CPU time spent in kernel code
```

```txt
real >> user + sys  -> likely waiting on I/O/network/sleep
user is high        -> CPU-bound in user code
sys is high         -> lots of time in kernel/syscalls
```

### Resource monitoring

```bash
htop
btop
free -h
sudo iotop
lsof
lsof -p <PID>
ss -tlnp
ss -tlnp | grep :8080
sudo nethogs
sudo iftop
```

Useful `htop` keys:

```txt
F6  sort
t   tree view
h   toggle threads
```

### Plottable data

Prefer structured performance data.

Good:

```csv
timestamp,latency_ns
1710000000,42
1710000001,51
```

Bad:

```txt
At time 1710000000 the latency was around 42 ns
```

```bash
gnuplot -e "set datafile separator ','; plot 'latency.csv' using 1:2 with lines"
```

For deeper analysis, use Python `matplotlib` or R `ggplot2`.

### CPU profiling with `perf`

```txt
tracing profiler  = records every function call
sampling profiler = periodically samples stack
```

Sampling profilers have lower overhead and are usually preferred.

```bash
perf stat ./program
perf stat -e cycles,instructions,branches,branch-misses ./program
perf record -g ./program
perf report
perf annotate -i perf.data --stdio
```

Common counters:

```txt
task-clock        CPU time used
context-switches  process/thread switches
cpu-migrations    moved between CPUs
page-faults       virtual memory faults
cycles            CPU cycles
instructions      instructions retired
branches          branch instructions
branch-misses     branch mispredictions
```

Inside `perf report`, `j` zooms in, `k` zooms out, and `a` toggles annotated source.

For better stack traces, compile with:

```bash
-g -fno-omit-frame-pointer
```

Flame graph:

```bash
perf record -g ./program
perf script | stackcollapse-perf.pl | flamegraph.pl > flamegraph.svg
imv flamegraph.svg
```

```txt
x-axis width = time/cost
y-axis       = call stack depth
wide boxes   = hot functions
```

### Valgrind profiling

Callgrind is a tracing profiler.

```bash
valgrind --tool=callgrind ./program
callgrind_annotate callgrind.out.<pid>
kcachegrind callgrind.out.<pid>
valgrind --tool=callgrind --cache-sim=yes ./program
```

Use Callgrind when exact call counts/instruction counts matter. Use `perf` first for lower-overhead profiling.

Massif profiles heap usage over time:

```bash
valgrind --tool=massif ./program
ms_print massif.out.<pid>
```

Use this for memory growth, excessive heap allocation, possible leaks, and allocation hotspots.

### Benchmarking and build presets

```bash
hyperfine --warmup 3 'fd -e jpg' 'find . -iname "*.jpg"'
```

Good for comparing find vs fd, grep vs ripgrep, old vs new implementation, and debug vs release build.

```txt
Use warmups.
Run multiple trials.
Compare mean and variance.
Do not trust one run.
```

C/C++ presets:

```bash
g++ -g -O1 -fsanitize=address,undefined -fno-omit-frame-pointer main.cpp -o main
g++ -O2 -g -fno-omit-frame-pointer main.cpp -o main
perf stat ./main
perf record -g ./main
perf report
valgrind --leak-check=full ./main
```

## Checklists

### Debugging checklist

```txt
1. Reproduce bug with smallest input.
2. Add test case if possible.
3. Use logs/prints to localize.
4. Use debugger if state is unclear.
5. Use sanitizer for memory/UB bugs.
6. Use strace if OS/file/process behavior is suspicious.
7. Fix root cause.
8. Re-run test.
```

### Profiling checklist

```txt
1. Measure with time/perf stat.
2. Check htop/btop/free/ss if resource-constrained.
3. Use perf record/report to find hot functions.
4. Optimize hot path only.
5. Benchmark with hyperfine or proper benchmark.
6. Re-measure.
```

### Commands to remember

```bash
# Debugger
gdb ./program
gdb -tui ./program

# Record-replay
rr record ./program
rr replay

# Syscall tracing
strace ./program
strace -f ./program
strace -e trace=file ./program
strace -p <PID>
strace -T ./program

# Sanitizers
gcc -fsanitize=address -g program.c -o program
gcc -fsanitize=undefined -g program.c -o program
gcc -fsanitize=thread -g program.c -o program

# Valgrind
valgrind --leak-check=full ./program
valgrind --tool=callgrind ./program
valgrind --tool=massif ./program

# Profiling
time ./program
perf stat ./program
perf stat -e cycles,instructions,branches,branch-misses ./program
perf record -g ./program
perf report

# Monitoring
htop
btop
free -h
lsof -p <PID>
ss -tlnp
ss -tlnp | grep :8080

# Benchmarking
hyperfine --warmup 3 'cmd1' 'cmd2'
```
