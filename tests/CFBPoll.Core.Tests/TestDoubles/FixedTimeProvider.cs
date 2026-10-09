namespace CFBPoll.Core.Tests.TestDoubles;

/// <summary>
/// A <see cref="TimeProvider"/> pinned to a settable instant, so time-dependent logic is deterministic in tests.
/// </summary>
public sealed class FixedTimeProvider : TimeProvider
{
    private DateTimeOffset _utcNow;

    public FixedTimeProvider(DateTimeOffset utcNow)
    {
        _utcNow = utcNow;
    }

    public override DateTimeOffset GetUtcNow() => _utcNow;

    public void SetUtcNow(DateTimeOffset utcNow) => _utcNow = utcNow;
}
