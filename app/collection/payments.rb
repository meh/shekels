class Payments < Lissio::Collection
	model Payment

	adapter Lissio::Adapter::Storage do
		filter do |value, desc|
			if desc
				if desc[:name] && value.recipient! != desc[:name]
					next false
				end

				if desc[:sign] && value.sign != desc[:sign]
					next false
				end
			end

			true
		end
	end
end
