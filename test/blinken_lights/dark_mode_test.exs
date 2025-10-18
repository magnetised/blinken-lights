defmodule BlinkenLights.DarkModeTest do
  use ExUnit.Case, async: true

  alias BlinkenLights.DarkMode
  alias BlinkenLights.DisplayConfig, as: DC

  test "times" do
    state =
      DarkMode.new(
        start_time: ~T[20:00:00],
        end_time: ~T[08:00:00],
        step: 0.1,
        dark_target: %{true => [brightness: 0.3], false => [brightness: 0.1]}
      )

    assert {state, []} = DarkMode.adjust(~T[12:00:00], %DC{brightness: 0.5}, state)

    assert {state, [dark_mode: true, brightness: 0.4]} =
             DarkMode.adjust(~T[20:00:00], %DC{brightness: 0.5}, state)

    assert {state, [brightness: 0.3]} = DarkMode.adjust(~T[20:01:00], %DC{brightness: 0.4}, state)
    assert {state, [brightness: 0.2]} = DarkMode.adjust(~T[20:02:00], %DC{brightness: 0.3}, state)
    assert {state, [brightness: 0.1]} = DarkMode.adjust(~T[20:03:00], %DC{brightness: 0.2}, state)
    assert {state, []} = DarkMode.adjust(~T[20:04:00], %DC{brightness: 0.1}, state)
    assert {state, []} = DarkMode.adjust(~T[23:04:00], %DC{brightness: 0.1}, state)
    assert {state, []} = DarkMode.adjust(~T[06:04:00], %DC{brightness: 0.1}, state)
    assert {state, []} = DarkMode.adjust(~T[08:00:00], %DC{brightness: 0.1}, state)

    assert {state, [dark_mode: false, brightness: 0.2]} =
             DarkMode.adjust(~T[08:01:00], %DC{brightness: 0.1}, state)

    assert {state, [brightness: 0.3]} = DarkMode.adjust(~T[08:02:00], %DC{brightness: 0.2}, state)
    assert {state, [brightness: 0.4]} = DarkMode.adjust(~T[08:03:00], %DC{brightness: 0.3}, state)
    assert {state, [brightness: 0.5]} = DarkMode.adjust(~T[08:04:00], %DC{brightness: 0.4}, state)
    assert {state, []} = DarkMode.adjust(~T[08:05:00], %DC{brightness: 0.5}, state)
    assert {state, []} = DarkMode.adjust(~T[12:05:00], %DC{brightness: 0.5}, state)
    assert {state, []} = DarkMode.adjust(~T[16:05:00], %DC{brightness: 0.5}, state)

    assert {state, [dark_mode: true, brightness: 0.4]} =
             DarkMode.adjust(~T[20:00:00], %DC{brightness: 0.5}, state)

    assert {state, [brightness: 0.3]} = DarkMode.adjust(~T[20:01:00], %DC{brightness: 0.4}, state)
    assert {state, [brightness: 0.2]} = DarkMode.adjust(~T[20:02:00], %DC{brightness: 0.3}, state)
    assert {state, [brightness: 0.1]} = DarkMode.adjust(~T[20:03:00], %DC{brightness: 0.2}, state)
    assert {state, []} = DarkMode.adjust(~T[20:04:00], %DC{brightness: 0.1}, state)
    assert {state, []} = DarkMode.adjust(~T[23:04:00], %DC{brightness: 0.1}, state)
    assert {state, []} = DarkMode.adjust(~T[06:04:00], %DC{brightness: 0.1}, state)
    assert {state, []} = DarkMode.adjust(~T[08:00:00], %DC{brightness: 0.1}, state)

    assert {state, [dark_mode: false, brightness: 0.2]} =
             DarkMode.adjust(~T[08:01:00], %DC{brightness: 0.1}, state)

    assert {state, [brightness: 0.3]} = DarkMode.adjust(~T[08:02:00], %DC{brightness: 0.2}, state)
    assert {state, [brightness: 0.4]} = DarkMode.adjust(~T[08:03:00], %DC{brightness: 0.3}, state)

    assert {_state, [brightness: 0.5]} =
             DarkMode.adjust(~T[08:04:00], %DC{brightness: 0.4}, state)
  end
end
