def apply(source):
    old = '    setDemoClock(ns); setCU(ns);'
    assert source.count(old) == 1
    # Keep the hash in the signed-in session, as teacherLogin already does.
    source = source.replace(old, '    setDemoClock(ns); setCU({ ...ns, th: h });')
    # The earlier sound adapter augments the legacy data before credits.js replaces it.
    start = source.index('function CreditsPage(props) {')
    end = source.index('function App() {', start)
    source = source[:start] + '// The revised CreditsPage is loaded before the app mounts.\n' + source[end:]
    return source
